# Schedules API Contract — PHP 8.4 / Laravel

This document is the single source of truth for the **Schedules** backend
that powers the React frontend in
[`src/pages/SchedulesPage.jsx`](src/pages/SchedulesPage.jsx),
[`src/pages/SchedulesListPage.jsx`](src/pages/SchedulesListPage.jsx) and the
in-memory store [`src/lib/schedulesStore.js`](src/lib/schedulesStore.js).

It assumes:
- **PHP 8.4 + Laravel 11+**, MySQL 8 / Postgres 14.
- Auth: standard admin session / personal-access token; only `admin`
  permission (`batches.view` already controls page access) — no per-row ACLs.
- All routes mounted under `/api/v1/`.
- All timestamps in **ISO-8601 UTC**.
- All datetimes received from the FE are **local dates with HH:MM start/end
  minutes** — there is no timezone arithmetic on the server side; date and
  minutes-of-day are stored verbatim.

---

## 1. Domain model

### 1.1 Entities

```
schedule
 ├─ id              ULID / UUID
 ├─ name            string (1..120)
 ├─ date            DATE   (YYYY-MM-DD, no time)
 ├─ published       bool   (default false)
 ├─ created_at, updated_at, created_by, updated_by
 ├─ batches[]       many-to-many → batch
 └─ events[]        one-to-many  → event

event
 ├─ id              ULID / UUID
 ├─ schedule_id     FK → schedule (cascade on delete)
 ├─ title           string (1..160)
 ├─ type            enum:
 │                    CLASSROOM_LECTURE | RECORDED_LECTURE | DISCUSSION
 │                  | ONLINE_EXAM       | OFFLINE_EXAM     | ONLINE_QUIZ
 │                  | LIVE_STREAM
 ├─ start_min       int (0..1435)   minutes from midnight, multiple of 5
 ├─ end_min         int (5..1440)   minutes from midnight, multiple of 5
 ├─ instructor      string|null     (free-text, references INSTRUCTOR_POOL)
 ├─ venue           string|null     (free-text, references VENUE_POOL)
 ├─ exam_id         string|null     references test-series exam
 ├─ quiz_id         string|null     references quiz
 ├─ course_id       string|null     ┐
 ├─ module_id       string|null     │ references course → module → chapter
 ├─ chapter_id      string|null     ┘
 └─ created_at, updated_at
```

**Notes**
- `start_min` < `end_min`. Both must be multiples of `SLOT_MIN = 5`.
- Type-specific fields below define which of the optional columns are
  required per `type` — see §6.4.

### 1.2 Reference pools

These are stable lookups managed elsewhere in the platform; the schedules
API only **reads** them.

| Pool          | Source                                | Shape                                                         |
|---------------|---------------------------------------|---------------------------------------------------------------|
| `batches`     | existing `/batches` API               | `{ id, name }`                                                |
| `instructors` | existing `/instructors` API           | `{ id, name }`                                                |
| `venues`      | new (see §5)                          | `{ id, name }`                                                |
| `test_series` | existing (or new wrapper)             | `{ id, name, exams: [{ id, name }] }`                         |
| `quizzes`     | existing `/quizzes`                   | `{ id, name }`                                                |
| `courses`     | existing `/courses`                   | `{ id, name, modules: [{ id, name, chapters: [{ id, name }]}]}`|

The schedules API does **not** validate that the referenced IDs exist
(that's a soft join). It only enforces that:
- The frontend sends the **string id** (e.g. `EX-101`, `QZ-7`, `CH-211`).
- The IDs survive round-trips unchanged.

---

## 2. Invariants (server-enforced)

These are non-negotiable. Every mutation endpoint must check them
**before** writing and respond with the documented error code on failure.

### 2.1 `BATCH_DATE_UNIQUE`
> A given **batch** may belong to **at most one schedule on any given date**,
> regardless of `published`/draft state.

Triggered by: create-schedule, update-schedule-meta, publish (it can add
batches), and duplicate.

### 2.2 `EVENT_OVERLAP`
> Within a single schedule, two events may never overlap in time:
> `(candidate.start_min < other.end_min) AND (candidate.end_min > other.start_min)`

Triggered by: add-event, update-event, recurrence (per target day),
copy-events (per source event against target's existing events).

### 2.3 `PUBLISHED_IMMUTABLE`
> A `published == true` schedule is read-only:
> - Cannot add / update / delete events.
> - Cannot accept copied-in events.
> - Meta (`name`, `date`, `batches`) cannot be changed.
> - It can be **unpublished** (which itself is the only allowed mutation
>   while published).

Triggered by: any mutation against a published schedule.

### 2.4 `RECURRENCE_PUBLISHED_BLOCK`
> A bulk recurrence expansion fails atomically if **any** target day's
> resolved owner-schedule is published. No partial writes.

### 2.5 `CONTENT_DUPLICATION_WARNING` (advisory, not blocking)
> When the request body includes an event of type `ONLINE_EXAM`,
> `ONLINE_QUIZ`, or `RECORDED_LECTURE` AND the operation is a recurrence or
> copy that fans the same `exam_id`/`quiz_id`/(`course_id`,`module_id`,
> `chapter_id`) across multiple instances, the FE asks the user to confirm
> first. The server **does not** block — but the client **must** pass
> `?confirm_content_duplication=true` to proceed (see §6.5 / §6.6).
> The server returns `409 CONTENT_DUPLICATION_REQUIRED` when the flag is
> missing, with a payload listing the bound events.

---

## 3. Auth + conventions

### 3.1 Auth
- All endpoints require an authenticated admin (`auth:sanctum` or whatever
  is used elsewhere) with `batches.view` permission for reads and an
  additional `schedules.write` permission for mutations.
- 401 / 403 surface as standard Laravel responses.

### 3.2 Common request/response conventions
- All payloads are JSON. `Accept: application/json` required.
- IDs are ULIDs (26-char Crockford base32) generated server-side. Client
  may submit a client-generated ID and the server should reject collisions.
- Dates: `YYYY-MM-DD`. Minutes-of-day: integer 0–1440.
- Lists return:
  ```json
  { "data": [...], "meta": { "total": 12, "page": 1, "per_page": 50 } }
  ```
- Singletons return `{ "data": { ... } }`.

### 3.3 Standard error envelope

```json
{
  "error": {
    "code":    "EVENT_OVERLAP",
    "message": "Event clashes with 'Biology' (10:00–10:55).",
    "details": { ... }
  }
}
```

| HTTP | When |
|------|------|
| 400  | Schema / value validation failed. Body in `details.fields`. |
| 401  | Unauthenticated. |
| 403  | Authenticated but not allowed. |
| 404  | Resource not found. |
| 409  | An invariant was violated (see §6 per-endpoint table). |
| 422  | Type-specific field validation failed (e.g. `ONLINE_EXAM` missing `exam_id`). |
| 500  | Anything else; do not leak details. |

---

## 4. Database schema (Laravel migration sketch)

```php
Schema::create('schedules', function (Blueprint $t) {
    $t->ulid('id')->primary();
    $t->string('name', 120);
    $t->date('date');
    $t->boolean('published')->default(false);
    $t->ulid('created_by')->nullable();
    $t->ulid('updated_by')->nullable();
    $t->timestamps();
    $t->index('date');
});

Schema::create('schedule_batches', function (Blueprint $t) {
    $t->ulid('schedule_id');
    $t->string('batch_id');           // FK to batches table
    $t->primary(['schedule_id', 'batch_id']);
    $t->foreign('schedule_id')->references('id')->on('schedules')->cascadeOnDelete();
    // Uniqueness invariant — enforced at the application layer (a single
    // batch can be in at most one schedule per date), reinforced by a
    // composite unique index across (date, batch_id) via a denormalized
    // column or a trigger. See §4.1.
});

Schema::create('schedule_events', function (Blueprint $t) {
    $t->ulid('id')->primary();
    $t->ulid('schedule_id');
    $t->string('title', 160);
    $t->enum('type', [
        'CLASSROOM_LECTURE','RECORDED_LECTURE','DISCUSSION',
        'ONLINE_EXAM','OFFLINE_EXAM','ONLINE_QUIZ','LIVE_STREAM',
    ]);
    $t->unsignedSmallInteger('start_min');   // 0..1440
    $t->unsignedSmallInteger('end_min');     // 0..1440
    $t->string('instructor', 160)->nullable();
    $t->string('venue', 160)->nullable();
    $t->string('exam_id', 64)->nullable();
    $t->string('quiz_id', 64)->nullable();
    $t->string('course_id', 64)->nullable();
    $t->string('module_id', 64)->nullable();
    $t->string('chapter_id', 64)->nullable();
    $t->timestamps();
    $t->foreign('schedule_id')->references('id')->on('schedules')->cascadeOnDelete();
    $t->index(['schedule_id', 'start_min']);
});
```

### 4.1 Enforcing `BATCH_DATE_UNIQUE` at DB level (recommended)

Add a denormalized `date` column on `schedule_batches`, kept in sync via an
`Observer`, and a unique index:

```php
$t->date('schedule_date');   // copied from schedules.date
$t->unique(['batch_id', 'schedule_date']);
```

Then *any* race condition between two simultaneous create/publish requests
fails atomically with a 23000 violation, which the controller maps to a
`BATCH_DATE_UNIQUE` 409.

### 4.2 Enforcing `EVENT_OVERLAP` at DB level (optional)

Cleanest under Postgres with `GIST + EXCLUDE`:

```sql
ALTER TABLE schedule_events
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    schedule_id WITH =,
    int4range(start_min, end_min, '[)') WITH &&
  );
```

Under MySQL — keep it in the application layer.

---

## 5. Reference-pool endpoints

These return small static lists. The frontend currently hardcodes the
samples; once these endpoints exist, the FE store reads them on mount.

### 5.1 `GET /api/v1/schedules/lookups`

Returns **all** lookup data in one round-trip (cache-friendly).

**200 Response**
```json
{
  "data": {
    "batches": [
      { "id": "BAT-001", "name": "IIT-JEE 2026 — Morning" },
      ...
    ],
    "instructors": [
      { "id": "INS-001", "name": "Manoj Bharadwaj Kansal (MBK)" },
      ...
    ],
    "venues": [
      { "id": "VEN-001", "name": "Auditorium A" },
      ...
    ],
    "test_series": [
      {
        "id": "TS-1",
        "name": "JEE Main 2026 — Series A",
        "exams": [
          { "id": "EX-101", "name": "Full Test 1" },
          ...
        ]
      },
      ...
    ],
    "quizzes": [
      { "id": "QZ-1", "name": "Daily Quiz — Mechanics" },
      ...
    ],
    "courses": [
      {
        "id": "C-1",
        "name": "JEE Physics",
        "modules": [
          {
            "id": "M-1",
            "name": "Mechanics",
            "chapters": [
              { "id": "CH-1", "name": "Kinematics 1D" },
              ...
            ]
          },
          ...
        ]
      },
      ...
    ]
  }
}
```

> If venues, test series, quizzes or courses already have their own list
> endpoints, this can be a thin aggregator. Cache for 5 minutes server-side.

---

## 6. Schedule + event endpoints

### 6.1 `GET /api/v1/schedules`

List schedules in a date range, optionally filtered by batch. Used by both
the list page and the calendar page on mount.

| Query param  | Type            | Required | Notes                                     |
|--------------|-----------------|----------|-------------------------------------------|
| `from`       | `YYYY-MM-DD`    | yes      | inclusive                                 |
| `to`         | `YYYY-MM-DD`    | yes      | inclusive; max 90-day window              |
| `batch_id[]` | `string`        | no       | repeatable; ANY-match (`OR`)              |
| `published`  | `bool`          | no       | filter by published state                 |
| `include`    | `events`        | no       | when `events`, embed all events per row   |
| `page`       | `int`           | no       | default 1                                 |
| `per_page`   | `int` ≤ 200     | no       | default 100                               |

**200 Response** (`include=events`)
```json
{
  "data": [
    {
      "id": "01HZ...",
      "name": "Morning Batch Schedule",
      "date": "2026-05-25",
      "published": true,
      "batches": [
        { "id": "BAT-001", "name": "IIT-JEE 2026 — Morning" },
        { "id": "BAT-003", "name": "NEET 2026 — Batch A" }
      ],
      "events": [
        {
          "id": "01HZ...",
          "title": "Maths Lecture",
          "type": "CLASSROOM_LECTURE",
          "start_min": 485,
          "end_min":   540,
          "instructor": "Manoj Bharadwaj Kansal (MBK)",
          "venue": "Auditorium A",
          "exam_id": null, "quiz_id": null,
          "course_id": null, "module_id": null, "chapter_id": null
        },
        ...
      ],
      "created_at": "2026-05-20T10:11:12Z",
      "updated_at": "2026-05-24T08:30:00Z"
    },
    ...
  ],
  "meta": { "total": 32, "page": 1, "per_page": 100 }
}
```

### 6.2 `GET /api/v1/schedules/{id}`

Returns one schedule with `events` always embedded. 404 on miss.

### 6.3 `POST /api/v1/schedules`

Create a draft schedule.

**Request**
```json
{
  "name":      "Morning Batch Schedule",
  "date":      "2026-05-26",
  "batch_ids": ["BAT-001", "BAT-003"]
}
```

**Validation**
- `name`: required, 1..120
- `date`: required, `YYYY-MM-DD`, not in the past (warn-only, server choice)
- `batch_ids`: array of strings, may be empty

**201 Response** — the created schedule (no events yet).

**Errors**
- `409 BATCH_DATE_UNIQUE` — any provided batch already lives in another
  schedule on `date`. Payload lists `details.conflicts: [{ batch_id, schedule_id, schedule_name }]`.

### 6.4 `PATCH /api/v1/schedules/{id}`

Update name/date/batches. Server rejects the whole call if the schedule is
published.

**Request** (any field optional, at least one required)
```json
{ "name": "Evening Batch Schedule", "date": "2026-05-27", "batch_ids": ["BAT-002"] }
```

**Errors**
- `409 PUBLISHED_IMMUTABLE`
- `409 BATCH_DATE_UNIQUE`

### 6.5 `DELETE /api/v1/schedules/{id}`

Hard delete (cascade events). Allowed even when published (cancellation),
because this is the *only* way to remove a published schedule from the
calendar; the FE confirms with the user first.

`204 No Content`.

### 6.6 `POST /api/v1/schedules/{id}/publish`

Atomic operation: set `published = true` and (optionally) link additional
batches.

**Request**
```json
{
  "additional_batch_ids": ["BAT-004"]
}
```

**Server-side checks (executed inside one DB transaction)**
1. Schedule exists & currently `published == false`.
2. Schedule has at least 1 event.
3. Schedule must have at least 1 linked batch (after merging `additional_batch_ids`).
4. `BATCH_DATE_UNIQUE` for the merged batch set (against all *other* schedules on the same date).

**200 Response** — the now-published schedule.

**Errors**
- `409 NO_EVENTS`
- `409 NO_BATCHES`
- `409 BATCH_DATE_UNIQUE`

### 6.7 `POST /api/v1/schedules/{id}/unpublish`

Sets `published = false`. No body required. Always allowed (admin override).

`200` with the schedule.

### 6.8 `POST /api/v1/schedules/{id}/duplicate`

Create a new draft schedule by copying all events from `{id}` onto a new
date with a new batch set.

**Request**
```json
{
  "name":      "Morning Batch Schedule (copy)",
  "date":      "2026-05-27",
  "batch_ids": ["BAT-001"]
}
```

**Steps (transactional)**
1. Validate `BATCH_DATE_UNIQUE` against the new date + batches.
2. Insert new schedule.
3. Copy each event from source, generating fresh IDs. Type-specific
   columns copy verbatim — including `exam_id`, `quiz_id`, `course/module/
   chapter`.

**201 Response** — the new schedule with copied events.

### 6.9 `POST /api/v1/schedules/{id}/copy-events`

Append events from another schedule onto this one. Used by the
*"Copy events from"* picker in the ScheduleModal / EditModal.

**Request**
```json
{
  "source_schedule_id": "01HZ...",
  "confirm_content_duplication": false
}
```

**Steps**
1. Target must be `published == false` (else `409 PUBLISHED_IMMUTABLE`).
2. Resolve source's events.
3. **Content-duplication pre-check** — if any source event has type in
   `{ ONLINE_EXAM, ONLINE_QUIZ, RECORDED_LECTURE }` **and** flag
   `confirm_content_duplication` is false, return:
   ```
   409 CONTENT_DUPLICATION_REQUIRED
   {
     "error": {
       "code": "CONTENT_DUPLICATION_REQUIRED",
       "message": "Some source events reference shared content.",
       "details": {
         "events": [
           { "title": "Test Series 1", "type": "ONLINE_EXAM", "exam_id": "EX-101" },
           ...
         ]
       }
     }
   }
   ```
4. **Overlap pre-check** — for each source event, check it does not
   overlap any existing event in target. If any clash, fail entire copy:
   ```
   409 EVENT_OVERLAP
   { "details": { "copying": { "title": "Test Series 1", "start_min": 840, "end_min": 1020 },
                  "existing": { "title": "Mock Test",   "start_min": 900, "end_min": 1020 } } }
   ```
5. Otherwise insert all events with fresh IDs (no overlap because source
   itself is internally non-overlapping).

**200 Response**
```json
{ "data": { "schedule": { /* updated schedule with all events */ }, "copied_count": 7 } }
```

---

## 7. Event endpoints

All event mutations validate type-specific fields per §6.4 below and the
`EVENT_OVERLAP` invariant.

### 7.1 `POST /api/v1/schedules/{id}/events`

Add a single event.

**Request — common envelope**
```json
{
  "title":     "Maths Lecture",
  "type":     "CLASSROOM_LECTURE",
  "start_min": 485,
  "end_min":   540,
  "instructor": "Manoj Bharadwaj Kansal (MBK)",
  "venue":      "Auditorium A",
  "exam_id":    null,
  "quiz_id":    null,
  "course_id":  null,
  "module_id":  null,
  "chapter_id": null
}
```

**Type-specific required fields** (validation, returns `422 VALIDATION`):

| `type`              | Required fields                       |
|---------------------|---------------------------------------|
| `CLASSROOM_LECTURE` | `instructor`, `venue`                 |
| `RECORDED_LECTURE`  | `course_id`, `module_id`, `chapter_id`|
| `DISCUSSION`        | `venue`                               |
| `ONLINE_EXAM`       | `exam_id`                             |
| `OFFLINE_EXAM`      | `venue`                               |
| `ONLINE_QUIZ`       | `quiz_id`                             |
| `LIVE_STREAM`       | `instructor`                          |

All other type-specific fields **must be null** for fields not listed above
(server can silently clear them, or 422 — choose 422 for strictness).

**Other validation**
- `start_min` and `end_min` multiples of 5, with `0 ≤ start_min < end_min ≤ 1440`.
- Schedule must be `published == false`.

**201 Response** — the new event.

**Errors**
- `409 PUBLISHED_IMMUTABLE`
- `409 EVENT_OVERLAP` — `details.conflicts: [{ id, title, start_min, end_min }]`
- `422 VALIDATION`

### 7.2 `PATCH /api/v1/schedules/{schedule_id}/events/{event_id}`

Partial update. **Used for both modal edits and drag-to-move/resize.**

**Request** (any subset of writable fields)
```json
{ "start_min": 600, "end_min": 660 }
```

**Errors** — same as add. Overlap check excludes the event being updated.

### 7.3 `DELETE /api/v1/schedules/{schedule_id}/events/{event_id}`

`204`. Schedule must be `published == false`.

### 7.4 `POST /api/v1/schedules/{id}/events/recurring`

Bulk-create events on multiple days following the FE recurrence rules. This
is the most complex endpoint — its behaviour mirrors the page's
recurrence flow exactly so that what the user previews in the
content-duplication confirm modal matches what the server does.

**Request**
```json
{
  "event": {
    "title": "Live Briefing",
    "type":  "LIVE_STREAM",
    "start_min": 1350,
    "end_min":   1370,
    "instructor": "Rajesh Kumar",
    "venue":      null,
    "exam_id":    null, "quiz_id":    null,
    "course_id":  null, "module_id":  null, "chapter_id": null
  },
  "recurrence": {
    "days":  [true, true, true, true, true, false, false],   // Mon..Sun
    "until": "2026-06-08"
  },
  "confirm_content_duplication": false
}
```

**Behaviour (transactional, atomic — no partial writes ever)**

Let the originating schedule be `S` with batch set `B = S.batches`.
Let `D = { dates from S.date through min(recurrence.until, S.date + 30d)
            where weekday-1..7 lookup hits a true in recurrence.days }`.

1. **Content-duplication gate.** If `event.type` is in
   `{ ONLINE_EXAM, ONLINE_QUIZ, RECORDED_LECTURE }` AND
   `confirm_content_duplication == false` → return
   `409 CONTENT_DUPLICATION_REQUIRED` with a payload describing the bound
   content (`exam_id`, `quiz_id`, or course/module/chapter).
2. **Published pre-scan.** For each `d ∈ D`:
   - Find candidate-owner schedules on `d`: any schedule whose batch list
     intersects `B`.
   - If **all** of `B`'s batches map to the *same* schedule `T` on `d`,
     and `T.published == true` → record `T` in `publishedHits`.
3. If `publishedHits` non-empty → return
   `409 RECURRENCE_PUBLISHED_BLOCK` with `details.hits: [{ date, schedule_name }]`.
4. **Overlap pre-scan.** For each `d ∈ D`:
   - Compute the resolved target schedule for `d`:
     - **No coverage** (no batch in `B` owns a schedule on `d`) → will
       create a fresh schedule, so no overlap possible.
     - **Common-owner** (all of `B` owned by the same draft schedule `T`)
       → check `event.[start,end)` against `T.events`. If overlaps → record
       `(d, conflicting_event_title)`.
     - **Partial coverage** (different schedules own different batches) →
       skip this day silently (FE skipped here too).
5. If overlap-scan non-empty → return
   `409 EVENT_OVERLAP` with `details.hits: [{ date, schedule_name, conflict }]`.
6. **Apply.** For each `d ∈ D`:
   - **No coverage** → create new draft schedule
     `{ name: S.name, date: d, batches: B }` and insert the event.
   - **Common-owner draft** → append the event.
   - **Partial coverage** → skip.
7. Return `200 { placed_new, appended, skipped_partial, schedules: [<all touched schedules>] }`.

**Note**: the partial-coverage case is the only silently-skipped one. All
other failures are atomic-stop with a 409.

---

## 8. Sorting / index hints

- `GET /schedules` should sort by `date ASC, name ASC`.
- Schedules-by-date queries are hot — index on `schedules.date`.
- Events-by-schedule queries are hot — composite index `(schedule_id, start_min)`.

---

## 9. ID generation

- Server generates ULIDs using Laravel's `Str::ulid()`.
- FE-generated IDs (currently `SCH-…`, `EV-…`) are placeholders — the FE
  must discard them and use server-returned IDs after each mutation.

---

## 10. Audit fields (optional but recommended)

Stamp `created_by` / `updated_by` from `auth()->user()->id`. The FE
doesn't read these yet but expose them in responses so the audit-log
feature can pick them up later.

---

## 11. End-to-end happy-path examples

### A. Build a day from scratch, then publish

```http
POST /api/v1/schedules
{ "name": "Morning Batch Schedule", "date": "2026-05-30", "batch_ids": ["BAT-001"] }
→ 201 { "data": { "id": "01...", "published": false, ... } }

POST /api/v1/schedules/01.../events
{ "title": "Maths Lecture", "type": "CLASSROOM_LECTURE",
  "start_min": 485, "end_min": 540,
  "instructor": "Manoj Bharadwaj Kansal (MBK)", "venue": "Auditorium A" }
→ 201 { "data": { "id": "01...", ... } }

# Several more events ...

POST /api/v1/schedules/01.../publish
{ "additional_batch_ids": ["BAT-003"] }
→ 200 { "data": { "id": "01...", "published": true, "batches": [...] } }
```

### B. Drag an event to a new time

```http
PATCH /api/v1/schedules/01HSCH/events/01HEV
{ "start_min": 600, "end_min": 660 }

→ 200 on success
→ 409 EVENT_OVERLAP if the new range clashes
→ 409 PUBLISHED_IMMUTABLE if the schedule is now published
```

### C. Repeat a Live Stream for the next 14 weekdays

```http
POST /api/v1/schedules/01HSCH/events/recurring
{
  "event": { "title": "Live Briefing", "type": "LIVE_STREAM",
             "start_min": 1350, "end_min": 1370, "instructor": "Rajesh Kumar" },
  "recurrence": { "days": [true,true,true,true,true,false,false],
                  "until": "2026-06-13" }
}
→ 200 { "data": { "placed_new": 5, "appended": 5, "skipped_partial": 0,
                  "schedules": [ ... ] } }

# Same call with type=ONLINE_EXAM:
→ 409 CONTENT_DUPLICATION_REQUIRED  → FE shows the warning modal
# After user confirms, FE retries with confirm_content_duplication=true.
```

### D. Copy events from another schedule

```http
POST /api/v1/schedules/01HSCH-TARGET/copy-events
{ "source_schedule_id": "01HSCH-SOURCE", "confirm_content_duplication": false }

→ 409 CONTENT_DUPLICATION_REQUIRED  (source has online exam)
→ FE shows confirm → retries with confirm_content_duplication=true.

→ 409 EVENT_OVERLAP  (one source event collides with an existing target event)
→ FE shows a precise error; admin removes the conflicting event manually.

→ 200 { "data": { "schedule": { ... }, "copied_count": 7 } }
```

---

## 12. What the frontend will need from you

A short checklist for the integration phase:

- [ ] `GET /api/v1/schedules/lookups` returning the six pools.
- [ ] `GET /api/v1/schedules` with `from`, `to`, `include=events`.
- [ ] `GET /api/v1/schedules/{id}` for deep-links (`/schedules?focus=<id>`).
- [ ] `POST /api/v1/schedules`, `PATCH`, `DELETE`.
- [ ] `POST /api/v1/schedules/{id}/publish` and `…/unpublish`.
- [ ] `POST /api/v1/schedules/{id}/duplicate`.
- [ ] `POST /api/v1/schedules/{id}/copy-events`.
- [ ] `POST /api/v1/schedules/{id}/events`, `PATCH`, `DELETE`.
- [ ] `POST /api/v1/schedules/{id}/events/recurring`.

All 409s should consistently use the `error.code` strings listed in §2 —
the FE switches on those codes today and can be wired to the API without
further changes.

---

*Document version 1.0 · authored against
[`src/lib/schedulesStore.js`](src/lib/schedulesStore.js) at the current
commit. Any future change to the FE invariants must update this file in the
same change-set.*
