# Leads Management — API Contract

Source of truth for the UI: [src/pages/LeadsManagementPage.jsx](src/pages/LeadsManagementPage.jsx)

This contract is written so Claude Code can implement the backend (and wire the React page to it) without further clarification. It follows the project's existing API conventions found in [src/lib/api.js](src/lib/api.js) and the integration style used in `CANDIDATE_API_INTEGRATION.md` / `CATALOG_API_INTEGRATION.md`.

---

## 1. Conventions

- **Base URL:** taken from `BASE_URL` in [src/lib/api.js](src/lib/api.js)
  - Local: `http://127.0.0.1:3004/api`
  - Prod:  `https://crisprtech.app/api`
- **Auth header:** `X-Access-Token: <token>` on every request (handled by the axios interceptor).
- **Resource root:** `/leads`
- **Content-Type:** `application/json` for all request bodies.
- **All timestamps:** ISO-8601 UTC strings (`2026-04-12T14:30:00Z`). Date-only fields use `YYYY-MM-DD` (e.g. `nextFollowUp`).
- **IDs:** server-generated integers (or strings if the rest of the system uses string IDs — be consistent with existing endpoints).

### Standard response envelope

List endpoints:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "size": 10, "total": 42, "totalPages": 5 }
}
```

Single-object / mutation endpoints:
```json
{ "success": true, "data": { ... } }
```

Errors:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Phone is required", "fields": { "phone": "required" } } }
```
HTTP status: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `500` server error.

---

## 2. Domain model

### Lead

| Field              | Type                                  | Notes |
|--------------------|---------------------------------------|-------|
| `id`               | integer                               | server-generated |
| `name`             | string                                | required |
| `phone`            | string                                | required, E.164 or 10-digit local |
| `email`            | string \| null                        | optional |
| `source`           | enum                                  | `Phone`, `Email`, `WhatsApp`, `Form`, `Website`, `Social Media` |
| `interest`         | enum                                  | `High`, `Neutral`, `Low` |
| `status`           | enum                                  | `Received`, `In Progress`, `Converted`, `Lost` |
| `associateId`      | string                                | FK → associate (`A01`…). See §6 |
| `associateName`    | string                                | denormalized, returned for display |
| `description`      | string                                | free text |
| `nextFollowUp`     | string (`YYYY-MM-DD`) \| null         | next scheduled follow-up date |
| `createdAt`        | ISO datetime                          | server-set on create |
| `updatedAt`        | ISO datetime                          | server-set on any mutation |
| `catalogItems`     | string[]                              | catalog item codes (e.g. `CR0001`). FK → catalog |
| `preferredTimeSlot`| enum \| `""`                          | `Morning (9–12)`, `Afternoon (12–3)`, `Evening (3–6)`, `Night (6–9)`, `Any Time` |
| `preferredComm`    | enum \| `""`                          | `Phone Call`, `WhatsApp`, `Email`, `SMS`, `In-Person` |
| `timeline`         | TimelineEvent[]                       | reverse-chronological NOT enforced — server returns chronological, UI reverses |
| `lastFollowUpAt`   | ISO datetime \| null                  | derived; timestamp of most recent `followup` event |
| `ageDays`          | integer                               | derived from `createdAt`. Optional — UI can compute |

### TimelineEvent (discriminated by `type`)

**Follow-up note** (`type: "followup"`):
```json
{
  "id": "evt_91823",
  "type": "followup",
  "text": "Shared brochure and fee structure",
  "addedBy": "Sales Admin",
  "addedById": "A01",
  "interest": "High",
  "at": "2026-04-10T10:15:00Z"
}
```

**Reassignment** (`type: "reassign"`):
```json
{
  "id": "evt_91824",
  "type": "reassign",
  "from": "Sales Admin",
  "to": "Counselor Priya",
  "fromId": "A01",
  "toId": "A03",
  "at": "2026-04-10T09:00:00Z"
}
```

**Status change** (`type: "status"`) — recommended addition so the timeline reflects status transitions:
```json
{
  "id": "evt_91825",
  "type": "status",
  "from": "Received",
  "to": "In Progress",
  "by": "Sales Admin",
  "at": "2026-04-10T09:00:00Z"
}
```

### Associate

```json
{ "id": "A01", "name": "Sales Admin", "active": true }
```

---

## 3. Endpoints

### 3.1 List leads — `GET /leads`

Server-side pagination, filtering and search (matches the React page filter state).

**Query params:**

| Param          | Type     | Required | Description |
|----------------|----------|----------|-------------|
| `page`         | int      | yes      | 1-indexed |
| `size`         | int      | yes      | rows per page (UI uses 8; allow up to 100) |
| `q`            | string   | no       | search across name, phone, email, associate name, source |
| `status`       | enum     | no       | `Received` \| `In Progress` \| `Converted` \| `Lost` |
| `interest`     | enum     | no       | `High` \| `Neutral` \| `Low` |
| `associateId`  | string   | no       | filter by assignee |
| `followUpDate` | `YYYY-MM-DD` | no   | exact match on `nextFollowUp`. UI sends `today`/`tomorrow` already resolved to a date string |
| `sortBy`       | string   | no       | `createdAt` (default), `nextFollowUp`, `name`, `lastFollowUpAt` |
| `sortDir`      | string   | no       | `asc` \| `desc` (default `desc` for date fields) |

**Response:** standard list envelope with `data: Lead[]`.

The list view does NOT need to return `timeline` for every row (perf). Return:
- everything **except** `timeline`
- plus `lastFollowUpAt` and `lastFollowUpText` (the text of the most recent follow-up, for tooltips if needed).

If returning `timeline` for every list row is cheap, that's fine too — but document the choice.

### 3.2 Lead stats — `GET /leads/stats`

For the 5 cards at the top of the page.

**Query params:** same filter params as list (`q`, `status` ignored here, `interest`, `associateId`, `followUpDate`) so stats can respect "Filter by associate" if we add that later. For v1, accept no params and return global counts.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 47,
    "received": 9,
    "inProgress": 21,
    "converted": 12,
    "lost": 5
  }
}
```

### 3.3 Get one lead — `GET /leads/:id`

Returns the full lead including `timeline` (chronological order, oldest → newest).

### 3.4 Create lead — `POST /leads`

**Body** (only these fields accepted on create — matches the Add-Lead modal):
```json
{
  "name": "Akhil Raj",
  "phone": "9876543210",
  "email": "akhil@test.com",
  "source": "WhatsApp",
  "interest": "Neutral",
  "status": "Received",
  "associateId": "A01",
  "description": "Asked about JEE crash course fees."
}
```

Server behavior on create:
- Validates `name` and `phone` (both required).
- Auto-computes `nextFollowUp` from interest: `High → +1d`, `Neutral → +3d`, `Low → +7d`. See `nextFollowUpDate()` in the React page.
- Sets `createdAt = updatedAt = now()`.
- Initializes `timeline: []`, `catalogItems: []`, `preferredTimeSlot: ""`, `preferredComm: ""`.

**Response:** `{ success: true, data: Lead }` (HTTP 201).

### 3.5 Update lead — `PATCH /leads/:id`

Partial update. Accepts any subset of:
`name`, `phone`, `email`, `source`, `interest`, `status`, `associateId`, `description`, `nextFollowUp`, `preferredTimeSlot`, `preferredComm`, `catalogItems`.

> Note: `status` and `associateId` may also be updated via the dedicated endpoints below (which additionally write a timeline event). `PATCH` should NOT auto-create timeline events — it's for "edit lead" silent updates only.

**Response:** `{ success: true, data: Lead }`.

### 3.6 Delete lead — `DELETE /leads/:id`

Optional for v1 (the UI does not expose delete today). If implemented, soft-delete preferred.

---

### 3.7 Add follow-up note — `POST /leads/:id/followups`

Called when the user clicks "Save Note" in the detail modal.

**Body:**
```json
{
  "text": "Student attended demo, very enthusiastic",
  "interest": "High",
  "nextFollowUp": "2026-04-14"
}
```

Server behavior:
- Appends a `followup` timeline event with `addedBy = currently-assigned associate name` (matches React: `addedBy: selectedLead.associate`) and `at = now()`.
- Updates `lead.interest = body.interest`.
- Updates `lead.nextFollowUp = body.nextFollowUp` if provided; otherwise auto-computes from interest.
- Updates `lead.updatedAt = now()` and `lead.lastFollowUpAt = now()`.

**Response:** `{ success: true, data: Lead }` — the full updated lead (including new timeline event).

### 3.8 Change status — `PATCH /leads/:id/status`

Used by both the row dropdown ("Mark as Converted") and the footer status buttons in the detail modal.

**Body:**
```json
{ "status": "Converted" }
```

Server behavior:
- Updates `status`, `updatedAt`.
- Appends a `status` timeline event capturing `from`, `to`, and `by` (current user from the auth token — fall back to the assigned associate name if no per-user identity is tracked).

**Response:** `{ success: true, data: Lead }`.

### 3.9 Reassign — `PATCH /leads/:id/assignee`

**Body:**
```json
{ "associateId": "A03" }
```

Server behavior:
- If `associateId` is unchanged, return current lead unchanged (no-op, no event).
- Otherwise update `associateId` + denormalized `associateName`, and append a `reassign` timeline event with `from`/`to` names + ids.

**Response:** `{ success: true, data: Lead }`.

### 3.10 Map catalog items — `PUT /leads/:id/catalog-items`

Used by the "+ Map Course" picker (checkboxes). The React page sends the full new array each time the user toggles — easier to model as a `PUT` that replaces the set.

**Body:**
```json
{ "catalogItems": ["CR0001", "CR0002"] }
```

Validation: each code must exist in the catalog. Reject with `400` if any code is unknown.

**Response:** `{ success: true, data: Lead }`.

### 3.11 Preferences — covered by `PATCH /leads/:id`

`preferredTimeSlot` and `preferredComm` are updated through the generic PATCH (§3.5). No dedicated endpoint needed — the React page debounces these and they're not interesting in the timeline.

---

## 4. Associates — `GET /associates`

The lead form, reassign modal, and filter dropdown all need the associate list.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "A01", "name": "Sales Admin",       "active": true },
    { "id": "A02", "name": "Admissions Desk",   "active": true },
    { "id": "A03", "name": "Counselor Priya",   "active": true },
    { "id": "A04", "name": "Counselor Arun",    "active": true }
  ]
}
```

For v1 this can be a static list backed by a `lead_associates` table; CRUD endpoints for associates are out of scope.

---

## 5. Catalog items lookup

The detail modal's course picker today reads from `catalogItemsDemo`. For backend wiring it should call the existing catalog list endpoint (see `CATALOG_API_INTEGRATION.md`) and use `{ code, title, type, sellingPrice }`. No new endpoint needed.

---

## 6. Validation rules (server-enforced)

| Field            | Rule |
|------------------|------|
| `name`           | required, 1–120 chars, letters/spaces only (matches `sanitizeName` in legacy controller) |
| `phone`          | required, 10 digits or E.164 |
| `email`          | optional, RFC 5322 if present |
| `source`         | must be one of the enum values |
| `interest`       | must be one of `High`/`Neutral`/`Low` |
| `status`         | must be one of the 4 status values |
| `associateId`    | must exist in associates table |
| `nextFollowUp`   | optional, `YYYY-MM-DD`, not earlier than today on create |
| `preferredTimeSlot` / `preferredComm` | enum or empty string |
| `catalogItems[]` | each code must resolve in the catalog |

---

## 7. Auth & authorization

- All endpoints require `X-Access-Token`.
- Suggested role model (refine to match the rest of the app):
  - **Admin / Sales Admin** — full CRUD on all leads.
  - **Associate / Counselor** — read all, but mutate (followup/status/reassign) only on leads where `associateId == self.id`. Reassigning *away* from self is allowed; reassigning someone else's lead requires admin.
- 401 → token missing/expired (interceptor in `api.js` already handles bounce to `/login`).
- 403 → authenticated but not allowed.

---

## 8. Frontend wiring checklist

These are the call sites in [src/pages/LeadsManagementPage.jsx](src/pages/LeadsManagementPage.jsx) that need to be swapped from `initialLeads` to API calls:

| UI action                          | Endpoint                                | Handler in JSX |
|------------------------------------|-----------------------------------------|----------------|
| Initial load + filter/search/page  | `GET /leads`                            | replace `initialLeads` + `useMemo(filtered)` |
| Stat cards                         | `GET /leads/stats`                      | replace `stats` `useMemo` |
| Associates dropdowns               | `GET /associates`                       | replace the hardcoded `associates` array |
| Add new lead (modal submit)        | `POST /leads`                           | `handleSaveLead` (the `!editingLead.id` branch) |
| Edit lead (modal submit)           | `PATCH /leads/:id`                      | `handleSaveLead` (the `editingLead.id` branch) |
| Update preferences in detail modal | `PATCH /leads/:id`                      | `updateLeadField` |
| Save follow-up note                | `POST /leads/:id/followups`             | `handleAddFollowUp` |
| Status change (row + modal footer) | `PATCH /leads/:id/status`               | `handleStatusChange` |
| Reassign                           | `PATCH /leads/:id/assignee`             | `handleReassign` |
| Toggle catalog item                | `PUT /leads/:id/catalog-items`          | `toggleCatalogItem` (send the resulting array) |

PDF export stays client-side (`handleExportPDF`).

---

## 9. Open questions for the backend team

1. **User identity in timeline:** does the backend have a logged-in admin user it can stamp on follow-ups / reassignments / status changes? If not, the UI's current behavior (stamping with the assigned associate's name) is fine and is what §3.7 documents.
2. **Are associates a fixed seed table or a managed entity?** v1 assumes seed.
3. **Soft vs hard delete** — confirm before implementing §3.6.
4. **Pagination size cap** — UI uses 8; backend should allow at least 100 for the PDF export (or have export call `size=large` / a dedicated `/leads/export` endpoint).
