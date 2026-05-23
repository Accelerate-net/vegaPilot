# Prompt: Build the Leads Management API (Laravel 11 / PHP 8.4 / MariaDB)

You are implementing the backend for the **Leads Management** screen of an existing admin app. The React frontend already exists at `src/pages/LeadsManagementPage.jsx` (in a sibling repo) and consumes JSON over HTTPS with an `X-Access-Token` header. Your job is to deliver a clean, production-ready Laravel API that the frontend can be wired to with minimal changes.

---

## 0. Stack & ground rules

- **PHP 8.4** — use typed properties, readonly where it fits, `match` expressions, enums, constructor property promotion.
- **Laravel 11** — use the modern app structure (no `app/Http/Kernel.php`; middleware/exception handling in `bootstrap/app.php`). Routes in `routes/api.php`.
- **MariaDB 10.6+** — utf8mb4. Use migrations (no raw SQL files). Foreign keys ON.
- **PSR-12** coding style. Run `./vendor/bin/pint` before finishing.
- **Strict types** at the top of every PHP file: `declare(strict_types=1);`.
- **No business logic in controllers.** Controllers validate (via FormRequest) and delegate to a service class. Services return Eloquent models / DTOs; an `API Resource` shapes the JSON.
- **Tests:** Pest (preferred) or PHPUnit feature tests covering happy path + one validation failure for each endpoint. Use `RefreshDatabase`.
- **Auth:** assume a middleware named `auth.token` already resolves `X-Access-Token` → an `admin_user` and binds it to `$request->user()`. If it doesn't exist in this repo, create a stub middleware that looks up the token in an `admin_users` table (id, name, token, role) and seeds two rows (`admin`, `associate`) so tests work. Don't reinvent Sanctum/Passport — keep it minimal and match what the rest of the app does.
- **Response envelope** — always:
  - success list: `{ "success": true, "data": [...], "meta": { "page", "size", "total", "totalPages" } }`
  - success single: `{ "success": true, "data": {...} }`
  - error: `{ "success": false, "error": { "code", "message", "fields"?: {...} } }`
  - Create a `JsonResponseFactory` / helper or a base controller method so this is consistent everywhere.
- **Errors** — register a handler in `bootstrap/app.php` that converts `ValidationException` (422 → still return 400 with `code: VALIDATION_ERROR` per the contract — the frontend expects 400), `ModelNotFoundException` (404 `NOT_FOUND`), `AuthenticationException` (401 `UNAUTHENTICATED`), `AuthorizationException` (403 `FORBIDDEN`) into the envelope above.
- **Timestamps in API** — ISO-8601 UTC (`2026-04-12T14:30:00Z`). Date-only fields stay `YYYY-MM-DD`. Use Carbon's `toIso8601ZuluString()`.
- **Database column naming:** snake_case. API field names: camelCase (mapped via API Resources).

---

## 1. Database schema

Create these migrations under `database/migrations/`. Use sensible defaults, indexes on every column that's filtered/sorted, and foreign keys.

### 1.1 `lead_associates`

| Column      | Type                | Notes |
|-------------|---------------------|-------|
| `id`        | string(8) primary   | e.g. `A01`. Not auto-increment — manually assigned in the seeder. |
| `name`      | string(120)         | unique |
| `active`    | boolean             | default `true` |
| `created_at`, `updated_at` | timestamps |

Seed four rows: `A01 Sales Admin`, `A02 Admissions Desk`, `A03 Counselor Priya`, `A04 Counselor Arun`.

### 1.2 `leads`

| Column                 | Type                                | Notes |
|------------------------|-------------------------------------|-------|
| `id`                   | bigIncrements                       | |
| `name`                 | string(120)                         | indexed |
| `phone`                | string(20)                          | indexed |
| `email`                | string(190) nullable                | indexed |
| `source`               | enum(`Phone`,`Email`,`WhatsApp`,`Form`,`Website`,`Social Media`) | |
| `interest`             | enum(`High`,`Neutral`,`Low`)        | default `Neutral`, indexed |
| `status`               | enum(`Received`,`In Progress`,`Converted`,`Lost`) | default `Received`, indexed |
| `associate_id`         | string(8) FK → `lead_associates.id` ON DELETE RESTRICT | indexed |
| `description`          | text nullable                       | |
| `next_follow_up`       | date nullable                       | indexed |
| `last_follow_up_at`    | timestamp nullable                  | indexed |
| `preferred_time_slot`  | string(32) default `''`             | one of the 5 enum strings or empty |
| `preferred_comm`       | string(32) default `''`             | one of the 5 enum strings or empty |
| `created_at`, `updated_at` | timestamps                      | |
| `deleted_at`           | softDeletes                         | |

Composite index on `(status, next_follow_up)` to speed the "follow-up today" view.

### 1.3 `lead_catalog_items`

Pivot for the `catalogItems` array on the lead.

| Column         | Type                                   |
|----------------|----------------------------------------|
| `lead_id`      | FK → `leads.id` ON DELETE CASCADE      |
| `catalog_code` | string(32)                             |
| primary key    | (`lead_id`, `catalog_code`)            |

> The `catalog_codes` themselves live in another service (see existing `catalog.html` / `CATALOG_API_INTEGRATION.md`). For v1, do **not** add a foreign key — just store the code as a string and validate against a configurable allow-list (see §3 below).

### 1.4 `lead_timeline_events`

| Column         | Type                                                                |
|----------------|---------------------------------------------------------------------|
| `id`           | bigIncrements                                                       |
| `lead_id`      | FK → `leads.id` ON DELETE CASCADE, indexed                          |
| `type`         | enum(`followup`,`reassign`,`status`)                                |
| `at`           | timestamp, indexed                                                  |
| `payload`      | json                                                                |
| `created_at`   | timestamp                                                           |

The `payload` shape per type:

- `followup`: `{ "text": "...", "addedBy": "Counselor Priya", "addedById": "A03", "interest": "High" }`
- `reassign`: `{ "from": "Sales Admin", "fromId": "A01", "to": "Counselor Priya", "toId": "A03" }`
- `status`:   `{ "from": "Received", "to": "In Progress", "by": "Sales Admin", "byId": "A01" }`

Don't normalize this further — JSON is the right call for an event log and matches what the frontend consumes.

---

## 2. Eloquent models

- `App\Models\Lead` — fillable matches the writable columns above; casts `next_follow_up` → `date:Y-m-d`, `last_follow_up_at` → `datetime`. Relations: `belongsTo(Associate::class, 'associate_id')`, `hasMany(TimelineEvent::class)->orderBy('at')`, `belongsToMany via lead_catalog_items` returning a flat array of codes through an accessor `catalog_items`.
- `App\Models\Associate` — primary key `id` (string, non-incrementing).
- `App\Models\TimelineEvent` — `payload` cast to `array`, `at` cast to datetime. `$timestamps = false` except `created_at` (use `const UPDATED_AT = null;`).

Use a PHP enum for each of `LeadStatus`, `LeadInterest`, `LeadSource`, `TimelineEventType` and cast the columns to those enums.

---

## 3. Config

`config/leads.php`:

```php
return [
    // Catalog codes allowed on POST/PUT /leads/:id/catalog-items.
    // Replace with a real catalog lookup once that service is in-process.
    'catalog_codes' => ['CR0001', 'CR0002', 'CR0003', 'CR0004'],

    // Days added to today when auto-computing nextFollowUp from interest.
    'follow_up_days' => ['High' => 1, 'Neutral' => 3, 'Low' => 7],

    // Max page size for GET /leads.
    'max_page_size' => 100,
];
```

---

## 4. Routes

All under `prefix=/api`, `middleware=['auth.token']`, except where noted. Group as `Route::prefix('leads')->controller(LeadController::class)`.

```
GET    /api/leads                       index
GET    /api/leads/stats                 stats
GET    /api/leads/{lead}                show
POST   /api/leads                       store
PATCH  /api/leads/{lead}                update
DELETE /api/leads/{lead}                destroy           (soft delete)
POST   /api/leads/{lead}/followups      addFollowUp
PATCH  /api/leads/{lead}/status         changeStatus
PATCH  /api/leads/{lead}/assignee       reassign
PUT    /api/leads/{lead}/catalog-items  setCatalogItems

GET    /api/associates                  AssociateController@index
```

Use route-model binding for `{lead}`. Return 404 envelope when not found.

---

## 5. Endpoint behavior

For each endpoint create a FormRequest in `app/Http/Requests/Leads/` with `rules()` and `messages()`. Authorization lives in policies (see §6).

### 5.1 `GET /leads` — index

Query params:

| Param           | Validation                                          |
|-----------------|-----------------------------------------------------|
| `page`          | required, integer, min 1                            |
| `size`          | required, integer, min 1, max `config('leads.max_page_size')` |
| `q`             | nullable, string, max 120                           |
| `status`        | nullable, enum                                      |
| `interest`      | nullable, enum                                      |
| `associateId`   | nullable, exists:lead_associates,id                 |
| `followUpDate`  | nullable, date_format:Y-m-d                         |
| `sortBy`        | nullable, in: `createdAt`,`nextFollowUp`,`name`,`lastFollowUpAt` |
| `sortDir`       | nullable, in: `asc`,`desc`                          |

Implementation:
- Service `LeadService::list(LeadListFilters $f): LengthAwarePaginator`.
- `q` matches against `name LIKE`, `phone LIKE`, `email LIKE`, `associates.name LIKE`, `source LIKE`. Use a single `where(function() { ... })` group with `orWhere` chains; join `lead_associates` once.
- Default sort: `created_at desc`.
- Eager-load `associate` only — do **not** load `timeline` in the list response.
- Resource: `LeadListResource` returns everything **except** `timeline`, plus computed `lastFollowUpAt` (already a column) and `lastFollowUpText` (one extra subquery — implement via `addSelect` with a correlated subquery on `lead_timeline_events`, not N+1).

### 5.2 `GET /leads/stats`

No params. Single grouped query:
```sql
SELECT status, COUNT(*) FROM leads WHERE deleted_at IS NULL GROUP BY status;
```
Map to:
```json
{ "total": N, "received": N, "inProgress": N, "converted": N, "lost": N }
```

### 5.3 `GET /leads/{lead}` — show

Eager-load `associate`, `timeline` (ordered by `at` ascending), and `catalogItems`. Use `LeadResource` (full version including `timeline`).

### 5.4 `POST /leads` — store

Accept only: `name`, `phone`, `email`, `source`, `interest`, `status`, `associateId`, `description`.

Validation:
- `name` required, regex `/^[A-Za-z\s]+$/`, 1–120
- `phone` required, regex `/^(\+?\d{10,15}|\d{10})$/`
- `email` nullable email max 190
- `source` required enum
- `interest` required enum (default `Neutral` if missing)
- `status` required enum (default `Received` if missing)
- `associateId` required exists
- `description` nullable string max 5000

Service behavior:
- Auto-compute `next_follow_up = today() + config('leads.follow_up_days')[interest]`.
- `last_follow_up_at = null`, `preferred_time_slot = ''`, `preferred_comm = ''`.
- Do **not** create a timeline event on creation.
- Return 201 + `LeadResource`.

### 5.5 `PATCH /leads/{lead}` — update

Partial update; any subset of: `name`, `phone`, `email`, `source`, `interest`, `status`, `associateId`, `description`, `nextFollowUp`, `preferredTimeSlot`, `preferredComm`, `catalogItems`.

Important: `PATCH` writes the fields **silently** (no timeline events). The dedicated status/assignee/followup endpoints are where events get created. This matches what the frontend's `updateLeadField` / "Edit Lead" modal expects.

If `catalogItems` is present, replace the pivot set (same logic as §5.10).

### 5.6 `DELETE /leads/{lead}` — destroy

Soft-delete. Policy: only `admin` role.

### 5.7 `POST /leads/{lead}/followups` — addFollowUp

Body:
```json
{ "text": "Student attended demo, very enthusiastic", "interest": "High", "nextFollowUp": "2026-04-14" }
```

Validation:
- `text` required, string, 1–2000
- `interest` required enum
- `nextFollowUp` nullable, `date_format:Y-m-d`, after_or_equal: today (allow today)

Service behavior (one DB transaction):
1. Append a `followup` timeline event with `addedBy = lead.associate.name`, `addedById = lead.associate.id`, `interest`, `at = now()`.
2. `lead.interest = body.interest`.
3. `lead.next_follow_up = body.nextFollowUp ?: today() + config('leads.follow_up_days')[interest]`.
4. `lead.last_follow_up_at = now()`.
5. `lead.save()`.
6. Return the full updated lead via `LeadResource`.

### 5.8 `PATCH /leads/{lead}/status` — changeStatus

Body: `{ "status": "Converted" }`. Enum-validated.

If unchanged → return current lead, **no** event written.

Otherwise (one transaction): append `status` timeline event `{ from, to, by: currentUser.name, byId: currentUser.id }`, update column, return full lead.

### 5.9 `PATCH /leads/{lead}/assignee` — reassign

Body: `{ "associateId": "A03" }`. Validate `exists:lead_associates,id`.

If unchanged → return current lead, no event.

Otherwise (one transaction): append `reassign` event with `from`/`to` names+ids, update `associate_id`, return full lead.

### 5.10 `PUT /leads/{lead}/catalog-items` — setCatalogItems

Body: `{ "catalogItems": ["CR0001", "CR0002"] }`.

Validation:
- `catalogItems` required array (empty array allowed = clear all)
- `catalogItems.*` string, in: `config('leads.catalog_codes')`

Service: replace the entire pivot set in a transaction (`delete where lead_id = X; insert ...`). Return full lead.

### 5.11 `GET /associates`

Return all `active = true` rows. Sorted by `name asc`. No pagination.

---

## 6. Authorization

Generate `LeadPolicy` and register it. Rules:

| Ability                                 | Admin | Associate |
|-----------------------------------------|-------|-----------|
| `viewAny`, `view`                       | ✅    | ✅ (all leads) |
| `create`                                | ✅    | ✅ |
| `update` (incl. status/preferences)     | ✅    | only if `lead.associate_id == user.id` |
| `addFollowUp`                           | ✅    | only if assigned to self |
| `reassign` *to* someone else            | ✅    | only if `lead.associate_id == user.id` (can reassign *away* from self) |
| `reassign` other people's leads         | ✅    | ❌ |
| `delete`                                | ✅    | ❌ |

Apply via `$this->authorize('update', $lead)` in controllers (or `Gate::authorize()`).

---

## 7. API Resources (response shape)

`LeadResource::toArray()` returns:
```php
[
    'id'                 => $this->id,
    'name'               => $this->name,
    'phone'              => $this->phone,
    'email'              => $this->email,
    'source'             => $this->source->value,
    'interest'           => $this->interest->value,
    'status'             => $this->status->value,
    'associateId'        => $this->associate_id,
    'associateName'      => $this->associate->name,
    'description'        => $this->description ?? '',
    'nextFollowUp'       => $this->next_follow_up?->format('Y-m-d'),
    'createdAt'          => $this->created_at->toIso8601ZuluString(),
    'updatedAt'          => $this->updated_at->toIso8601ZuluString(),
    'lastFollowUpAt'     => $this->last_follow_up_at?->toIso8601ZuluString(),
    'catalogItems'       => $this->catalog_items,   // flat string[]
    'preferredTimeSlot'  => $this->preferred_time_slot,
    'preferredComm'      => $this->preferred_comm,
    'ageDays'            => (int) $this->created_at->diffInDays(now()),
    'timeline'           => TimelineEventResource::collection($this->whenLoaded('timeline')),
]
```

`TimelineEventResource::toArray()`:
```php
['id' => (string)$this->id, 'type' => $this->type->value, 'at' => $this->at->toIso8601ZuluString(), ...$this->payload]
```
(spreads payload onto top-level — the frontend reads `evt.text`, `evt.from`, etc. directly.)

`LeadListResource` = same as `LeadResource` minus `timeline`, plus `lastFollowUpText` (string|null).

`AssociateResource`: `{ id, name, active }`.

---

## 8. Tests

At minimum, one feature test file per endpoint group, using `RefreshDatabase` and a `LeadFactory` + `AssociateFactory`.

Required coverage:
- `index`: pagination meta is correct; `q` matches name/phone; `status` filter narrows results; sort by `nextFollowUp asc` orders correctly.
- `stats`: returns correct counts after seeding 1 of each status.
- `store`: 201 on valid, 400 with `fields.phone` on missing phone, `nextFollowUp` auto-set from interest.
- `addFollowUp`: appends timeline event; updates `interest`, `next_follow_up`, `last_follow_up_at`.
- `changeStatus`: appends `status` event; no-op when unchanged returns no extra event.
- `reassign`: appends `reassign` event; associate-role user cannot reassign someone else's lead (403).
- `setCatalogItems`: replaces set; unknown code → 400.
- `index` returns leads with `timeline` **omitted**, but `lastFollowUpAt` populated.

---

## 9. Seeders

- `AssociateSeeder` — the four rows from §1.1.
- `LeadSeeder` — 6 demo leads matching the shape used in `LeadsManagementPage.jsx`'s `initialLeads` so the frontend looks identical when wired up. Include timeline events for each.

`DatabaseSeeder` calls both.

---

## 10. Deliverables

When you're done, the repo should contain:

- Migrations, models, enums, policies, requests, resources, controllers, services, seeders for everything above.
- `routes/api.php` updated.
- `config/leads.php`.
- A short `README` section (append to existing project README, or create `LEADS_BACKEND_README.md`) documenting:
  - How to run migrations + seed.
  - cURL examples for all 11 endpoints.
  - The auth token to use locally (from the seeded `admin_users` row).
- All Pint-formatted; all tests green (`php artisan test`).

Do **not** modify the React frontend in this task — it lives in a separate repo. The contract above is the source of truth for request/response shapes; if you find a real ambiguity, leave a `// TODO(contract):` comment and call it out in your summary rather than guessing.

---

## 11. Reference frontend (read-only)

The page that consumes this API: [src/pages/LeadsManagementPage.jsx](src/pages/LeadsManagementPage.jsx). Read it once before starting to confirm field names and enum spellings — the strings must match exactly (e.g. `"In Progress"` with the space, `"Social Media"` with the space, `"Morning (9–12)"` with the en-dash, not a hyphen).

The axios setup the frontend uses: [src/lib/api.js](src/lib/api.js). Your responses must satisfy that interceptor — in particular, 401 must be returned with no body restriction (interceptor will redirect).
