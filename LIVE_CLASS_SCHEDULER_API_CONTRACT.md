# Live Class Scheduler — Data Model & API Contract

Target stack: **PHP 8.4 / Laravel 12 / MySQL 8.x / Redis / Laravel Reverb
(WebSockets)**.

This document is the complete contract the React admin pages
(`/live-class-scheduler` and `/live-class-activity-planner`) expect. Implement
the shapes and endpoints below and the front-end will work without changes.

Conventions follow the house style already used by
`DIGITAL_SIGNAGE_API_CONTRACT.md`:

| Topic        | Convention                                                                             |
|--------------|----------------------------------------------------------------------------------------|
| IDs          | **ULID** strings (26 chars), public-facing in URLs. (Demo data uses `LC-1001` display codes — see §3 note.) |
| Timestamps   | ISO‑8601 UTC strings (`2026-06-03T09:30:00Z`), serialised via `->toIso8601String()`.   |
| Booleans     | JSON `true`/`false`, never `0`/`1`.                                                     |
| Enums        | lower_snake or the exact strings listed in §3, validated against fixed allow-lists.     |
| Pagination   | `?page=1&per_page=25` → `{ data: [...], meta: { page, per_page, total, last_page } }`.  |
| Filtering    | Query string. Multiple values comma-separated.                                         |
| Sorting      | `?sort=-scheduled_at` (prefix `-` = desc). Default `-scheduled_at`.                     |
| Errors       | See §10.                                                                                |
| Auth header  | `Authorization: Bearer <token>` (existing admin Sanctum token).                        |
| Soft deletes | All entities use `deleted_at` (Laravel `SoftDeletes`).                                  |

Admin API base path: **`/api/v1/live-classes`**

---

## 0. Changelog — YouTube Live alignment

This revision aligns the `youtube` streaming mode with the platform decision to
use **YouTube Live (Unlisted + embedding enabled)** as the video backend, with
OBS Studio as the encoder and app-layer access control. Changes vs. the previous
revision:

- **Stack** pinned to Laravel 12 / PHP 8.4 / Reverb (was "Laravel 11+ / Pusher or
  Reverb").
- **`live_classes`** gains explicit YouTube columns (`youtube_broadcast_id`,
  `youtube_stream_id`, `youtube_watch_url`, `youtube_embed_url`,
  `youtube_rtmp_url`, `youtube_stream_key`, `youtube_privacy_status`,
  `youtube_lifecycle_status`, `youtube_provisioned_at`). The legacy generic
  `stream_url` / `stream_key` are retained as back-compat aliases (§2.1 note).
- **Wire format (§4)** returns a nested `youtube` object for `mode=youtube`.
  RTMP URL and stream key are **admin/host-only** and must never reach student
  clients.
- **Provisioning flow (§6.4)**: creating a `youtube` class auto-provisions a
  YouTube Live Broadcast + Stream via Data API v3 and binds them; a dedicated
  `POST /{id}/youtube/provision` endpoint covers retry/regeneration.
- **`launch` / `end` (§6.1)** now describe how our lifecycle maps onto the
  YouTube broadcast lifecycle (and the `enableAutoStart` / `enableAutoStop`
  recommendation).
- **Errors (§10)** gain YouTube-specific codes.
- **New §12** documents the YouTube integration (OAuth, channel ownership,
  quota, latency, the Unlisted access-control caveat).

---

## 1. Purpose

The **Live Class Scheduler** lets an admin schedule, launch, monitor, and review
live streaming classes / webinars. Each class has a host (instructor), a target
participant audience, a streaming mode (system-integrated WebRTC vs. external
YouTube Live), and a lifecycle status (`scheduled → live → completed`, or
`cancelled`). Classes can also be launched **instantly** ("Go Live Now").

For `mode=youtube`, the platform owns a single YouTube channel; the server
creates an **Unlisted, embeddable** broadcast per class and hands the teacher an
RTMP URL + stream key for OBS. Students watch the embedded player inside the apps
and never touch YouTube directly. See §12 for the full integration model.

Each class may carry a set of pre-configured **Activities** (Polls and Quizzes)
authored ahead of time on the Activity Planner page. These are saved as `draft`
and later published into the live stream by the studio (publish flow is out of
scope for this contract — only draft authoring is covered here).

---

## 2. Database schema

### 2.1 `live_classes`

```sql
CREATE TABLE live_classes (
  id                 CHAR(26) PRIMARY KEY,             -- ULID
  title              VARCHAR(200) NOT NULL,
  host_id            CHAR(26) NULL,                    -- FK -> instructors/users (nullable; see §3)
  host_name          VARCHAR(160) NOT NULL,            -- denormalised display name
  participants_label VARCHAR(160) NOT NULL,            -- audience descriptor, e.g. "Batch A", "All Registered"
  audience_type      VARCHAR(32)  NOT NULL DEFAULT 'all', -- see §3.3
  audience_ref       VARCHAR(160) NULL,                -- batch/course id when audience_type is batch/course
  mode               VARCHAR(16)  NOT NULL,            -- 'system' | 'youtube'  (§3.2)
  is_instant         BOOLEAN      NOT NULL DEFAULT FALSE,
  status             VARCHAR(16)  NOT NULL DEFAULT 'scheduled', -- §3.1
  scheduled_at       TIMESTAMP    NULL,                -- start time (=created time if instant)
  duration_label     VARCHAR(40)  NULL,                -- free text, e.g. "1h 30m"
  duration_minutes   INT          NULL,                -- optional parsed duration
  started_at         TIMESTAMP    NULL,
  ended_at           TIMESTAMP    NULL,
  rating             DECIMAL(2,1) NULL,                -- avg feedback rating 0.0–5.0, null until rated
  -- advanced settings (§3.4)
  strict_moderation  BOOLEAN      NOT NULL DEFAULT FALSE,
  auto_feedback      BOOLEAN      NOT NULL DEFAULT FALSE,
  webinar_mode       BOOLEAN      NOT NULL DEFAULT FALSE,
  ask_to_join        BOOLEAN      NOT NULL DEFAULT FALSE,
  -- YouTube Live integration metadata (server-populated; §12) -----------------
  youtube_broadcast_id     VARCHAR(64)   NULL,         -- == YouTube video id
  youtube_stream_id        VARCHAR(64)   NULL,         -- liveStream resource id
  youtube_watch_url        VARCHAR(2048) NULL,         -- https://www.youtube.com/watch?v={broadcast_id}
  youtube_embed_url        VARCHAR(2048) NULL,         -- https://www.youtube.com/embed/{broadcast_id}
  youtube_rtmp_url         VARCHAR(2048) NULL,         -- OBS "Server" (cdn.ingestionInfo.ingestionAddress)
  youtube_rtmp_backup_url  VARCHAR(2048) NULL,         -- optional backup ingest
  youtube_stream_key       VARCHAR(255)  NULL,         -- OBS "Stream Key" (cdn.ingestionInfo.streamName) — SENSITIVE
  youtube_privacy_status   VARCHAR(16)   NOT NULL DEFAULT 'unlisted', -- always 'unlisted' (§12)
  youtube_lifecycle_status VARCHAR(24)   NULL,         -- mirrors broadcast lifeCycleStatus (§12.4)
  youtube_provisioned_at   TIMESTAMP     NULL,         -- when broadcast+stream were created & bound
  -- legacy generic stream fields (back-compat aliases; §2.1 note) -------------
  stream_url         VARCHAR(2048) NULL,               -- system room URL, OR mirrors youtube_watch_url
  stream_key         VARCHAR(255)  NULL,               -- system key, OR mirrors youtube_stream_key (SENSITIVE)
  created_by_user_id BIGINT       NULL,
  created_at         TIMESTAMP    NULL,
  updated_at         TIMESTAMP    NULL,
  deleted_at         TIMESTAMP    NULL,
  INDEX (status),
  INDEX (mode),
  INDEX (scheduled_at),
  INDEX (youtube_broadcast_id)
);
```

> **`stream_url` / `stream_key` note.** These remain for `mode=system` and for
> back-compat with any caller that already reads them. For `mode=youtube` the
> server mirrors `youtube_watch_url` into `stream_url` and `youtube_stream_key`
> into `stream_key`, but new front-end code should read the explicit
> `youtube_*` fields (§4.1). Treat `stream_key` / `youtube_stream_key` /
> `youtube_rtmp_url` as secrets — admin/host only, never logged, never returned
> to student clients (§4.2, §8).

### 2.2 `live_class_activities`

```sql
CREATE TABLE live_class_activities (
  id             CHAR(26) PRIMARY KEY,                 -- ULID
  live_class_id  CHAR(26) NOT NULL,
  type           VARCHAR(8)  NOT NULL,                 -- 'poll' | 'quiz'
  title          VARCHAR(300) NOT NULL,                -- poll question OR quiz title
  status         VARCHAR(16) NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'closed'
  duration_minutes INT       NULL,                     -- quiz only (1–120)
  payload        JSON        NOT NULL,                 -- options (poll) or questions (quiz); see §5
  position       INT         NOT NULL DEFAULT 0,       -- ordering within a class
  created_at     TIMESTAMP   NULL,
  updated_at     TIMESTAMP   NULL,
  deleted_at     TIMESTAMP   NULL,
  FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  INDEX (live_class_id, type)
);
```

The poll options / quiz questions can be normalised into child tables if you
prefer — **the wire format in §5 is authoritative** regardless of storage.

---

## 3. Enums & field notes

### 3.1 `status`
`scheduled` | `live` | `completed` | `cancelled`

Transitions: `scheduled → live` (on launch / scheduled start), `live →
completed` (on end), and `scheduled → cancelled` (admin cancel — the FE currently
removes the row from the list; soft-delete + a `cancelled` status both satisfy
this, prefer the status so reporting survives). An **instant** class is created
directly as `live`.

For `mode=youtube`, this internal `status` is distinct from the YouTube broadcast
`youtube_lifecycle_status` (§12.4). The two are reconciled at launch/end and by
optional polling; `status` is always the authoritative value the FE renders.

### 3.2 `mode`
`system` (system-integrated streaming) | `youtube` (YouTube Live). The FE labels
these "System Integrated" and "YouTube Live".

Creating a class with `mode=youtube` triggers YouTube provisioning (§6.4). A
class's `mode` is **immutable after creation** — switching modes would orphan a
provisioned broadcast; cancel and re-create instead. `PATCH` requests that
include a changed `mode` return `INVALID_STATE_TRANSITION` 409.

### 3.3 `audience_type`
`all` (All Registered) | `unrestricted` | `batch` | `course`. The current FE
sends a single free-text `participants_label` (e.g. `"Batch A"`, `"Course: IAT
2026"`); you may accept just that label and derive `audience_type`/`audience_ref`
server-side, or accept the structured fields. Return both in responses.

> Audience selection is what enforces **who may watch** a YouTube class inside our
> apps — the Unlisted broadcast itself has no per-viewer YouTube ACL (§12.5).

### 3.4 Advanced settings (booleans, all default `false`)
- `strict_moderation` — chat limited & actively moderated.
- `auto_feedback` — trigger feedback survey at session end.
- `webinar_mode` — one-way video streaming. For `mode=youtube` this is implicitly
  true (YouTube Live is one-way teacher → students); the server may force
  `webinar_mode=true` on youtube classes and the FE should treat the toggle as
  read-only in that mode.
- `ask_to_join` — host manually admits participants. Not meaningful for
  `mode=youtube` (anyone in the target audience watches the embed); ignored.

### 3.5 ID note
The demo UI shows codes like `LC-1001`. For the real API use ULIDs in URLs and
the `id` field. If you want a human code too, add a `display_code` string to the
entity; the FE will render whatever `id`/code you return.

### 3.6 `youtube_privacy_status`
`unlisted` (default and only value the server sets). Private streams are **not**
used because they require per-Google-account grants — impractical at our scale.
Public is not used to keep classes out of YouTube search/recommendations. See
§12.5 for the access-control implications of Unlisted.

---

## 4. Live class wire format

### 4.1 Shape
Every endpoint returning a class returns this shape. The `youtube` object is
`null` when `mode=system`.

```json
{
  "id": "01J8XR…",
  "title": "Solving HCV Mechanics - Part 1",
  "host_id": "01J8AA…",
  "host_name": "Vikram Singh",
  "participants_label": "Batch A",
  "audience_type": "batch",
  "audience_ref": "batch-a",
  "mode": "youtube",
  "is_instant": false,
  "status": "live",
  "scheduled_at": "2026-06-01T10:00:00Z",
  "duration_label": "1h 30m",
  "duration_minutes": 90,
  "started_at": "2026-06-01T10:00:00Z",
  "ended_at": null,
  "rating": null,
  "strict_moderation": false,
  "auto_feedback": true,
  "webinar_mode": true,
  "ask_to_join": false,
  "youtube": {
    "broadcast_id": "abcd1234XYZ",
    "stream_id": "Xy9...stream",
    "privacy_status": "unlisted",
    "lifecycle_status": "live",
    "watch_url": "https://www.youtube.com/watch?v=abcd1234XYZ",
    "embed_url": "https://www.youtube.com/embed/abcd1234XYZ",
    "provisioned_at": "2026-05-28T09:31:12Z",
    "rtmp_url": "rtmp://a.rtmp.youtube.com/live2",
    "rtmp_backup_url": "rtmp://b.rtmp.youtube.com/live2?backup=1",
    "stream_key": "abcd-efgh-ijkl-mnop-qrst"
  },
  "stream_url": "https://www.youtube.com/watch?v=abcd1234XYZ",
  "stream_key": null,
  "activities_count": 2,
  "created_at": "2026-05-28T09:30:00Z",
  "updated_at": "2026-06-01T10:00:00Z"
}
```

Field notes:
- `rating` — `null` until feedback is aggregated; otherwise `0.0`–`5.0`.
- `activities_count` — count of non-deleted activities (cheap to include for the list).
- `youtube` — present (object) only for `mode=youtube`; `null` for `system`.
  Fields `provisioned_at`/`lifecycle_status` are `null` until provisioning
  succeeds (§6.4).

### 4.2 Sensitive-field redaction (IMPORTANT)
`youtube.rtmp_url`, `youtube.rtmp_backup_url`, `youtube.stream_key`, and the
legacy `stream_key` are **secrets**. They are returned **only** to callers
holding `liveClass.edit` (admin) or to the class's own host, and **only** over
the admin API.

- For any other caller (including the student Flutter app and web player), these
  four fields MUST be omitted or `null`. The student-facing payload exposes at
  most `youtube.embed_url` / `youtube.watch_url` (and only when the requester is
  in the class's target audience).
- Never write these values to logs, traces, or error payloads.

> The §4.1 example shows the **admin** view. The student-facing view returns the
> same class without the secret fields and without `host`-internal data.

---

## 5. Activity wire format

### Poll
```json
{
  "id": "01J8ACT…",
  "live_class_id": "01J8XR…",
  "type": "poll",
  "title": "How well do you understand thermodynamics?",
  "status": "draft",
  "payload": {
    "options": ["Very well", "Somewhat", "Not really", "Completely lost"]
  },
  "position": 0,
  "created_at": "2026-06-02T08:00:00Z",
  "updated_at": "2026-06-02T08:00:00Z"
}
```
Poll rules: 2–8 options, each non-empty.

### Quiz
```json
{
  "id": "01J8ACT…",
  "live_class_id": "01J8XR…",
  "type": "quiz",
  "title": "Mid-session Checkpoint Quiz",
  "status": "draft",
  "duration_minutes": 10,
  "payload": {
    "questions": [
      {
        "question": "What is the First Law of Thermodynamics?",
        "image_url": null,
        "options": ["Conservation of Energy", "Entropy increases", "F=ma", "E=mc2"],
        "correct_index": 0
      }
    ]
  },
  "position": 1,
  "created_at": "2026-06-02T08:05:00Z",
  "updated_at": "2026-06-02T08:05:00Z"
}
```
Quiz rules: ≥1 question; each question has exactly **4** options (all non-empty),
a `correct_index` in `0..3`, optional `image_url`. `duration_minutes` 1–120.

> The current FE quiz form always renders 4 options (A–D). If you want to allow a
> variable count later, keep `options` an array and `correct_index` < its length.

---

## 6. Admin REST API

All routes prefix `/api/v1/live-classes`. Sanctum middleware + RBAC (§8).

### 6.1 Live classes

| Method | Path                | Body / notes |
|--------|---------------------|--------------|
| GET    | `/`                 | List, paginated. Filters: `?search=` (matches `title` or `host_name`), `?status=`, `?mode=`. Default sort `-scheduled_at`. Returns `{ data: [class…], meta }`. |
| POST   | `/`                 | Create / schedule (or launch instantly). For `mode=youtube`, auto-provisions YouTube (§6.4). Body §6.2. Returns the full class (§4). |
| GET    | `/{id}`             | Single class, including `activities_count` and the `youtube` object (admin view). |
| PATCH  | `/{id}`             | Partial update (any subset of the create body). Used for edits and reschedule. `mode` is immutable (§3.2). |
| DELETE | `/{id}`             | Cancel the class. Soft delete OR set `status=cancelled` (preferred). For `mode=youtube`, also transitions the broadcast to `complete`/revokes it (§6.4). FE removes it from the list on success. |
| POST   | `/{id}/launch`      | Transition `scheduled → live` now; sets `started_at`. For `mode=youtube` see below. Returns updated class. |
| POST   | `/{id}/end`         | Transition `live → completed`; sets `ended_at`. For `mode=youtube` see below. Returns updated class. |

**`launch` for `mode=youtube`.** YouTube will only move a broadcast to `live`
once its bound stream is **receiving data** (i.e. OBS is pushing). Two supported
behaviours, configurable per §12.3:
- **Auto (recommended):** the broadcast is created with
  `contentDetails.enableAutoStart=true`, so YouTube transitions it to `live`
  automatically when OBS starts. `POST /{id}/launch` then simply sets our
  internal `status=live` + `started_at` and (optionally) verifies the broadcast
  is `live`/`testing`.
- **Manual:** `POST /{id}/launch` calls `liveBroadcasts.transition`
  (`testing` → `live`). If the stream is not yet active, returns
  `YOUTUBE_TRANSITION_FAILED` 409 (teacher must start OBS first).

**`end` for `mode=youtube`.** With `enableAutoStop=true` the broadcast completes
when OBS stops; `POST /{id}/end` sets internal `status=completed` + `ended_at`.
In manual mode it also calls `liveBroadcasts.transition` (→ `complete`). Ending
is idempotent: ending an already-completed broadcast is a no-op success.

#### `?search=` / filter semantics
`search` is a case-insensitive substring match on `title` OR `host_name` (the FE
searches "by title or host"). `status` and `mode` are exact enum matches.

### 6.2 Create / update body

```jsonc
{
  "title": "Physics Revision Class",   // required, string, max 200
  "host_id": "01J8AA…",                // nullable ULID; OR send host_name only
  "host_name": "Vikram Singh",         // required if host_id omitted, max 160
  "participants_label": "Batch A",     // required, max 160  (audience descriptor)
  "audience_type": "batch",            // optional; one of §3.3 (server may derive)
  "audience_ref": "batch-a",           // optional
  "mode": "youtube",                   // required, 'system' | 'youtube'  (immutable after create)
  "is_instant": false,                 // boolean, default false
  "scheduled_at": "2026-06-05T10:00:00Z", // required when is_instant=false; ignored/now when true
  "duration_label": "1h 30m",          // optional free text
  "duration_minutes": 90,              // optional integer
  "strict_moderation": false,          // optional booleans (§3.4)
  "auto_feedback": false,
  "webinar_mode": false,               // forced true server-side when mode=youtube
  "ask_to_join": false                 // ignored when mode=youtube
}
```

> All `youtube_*` fields are **server-populated only**. The client never sends
> broadcast id, stream key, URLs, etc.; any such fields in the request body are
> ignored.

Behaviour:
- `is_instant = true` → ignore `scheduled_at`, set `scheduled_at = now()`, create
  with `status = live`, set `started_at = now()`. For `mode=youtube` the
  broadcast is provisioned with a `scheduledStartTime` of `now()` and
  `enableAutoStart=true`, so it goes live as soon as the teacher's OBS connects.
- `is_instant = false` → `scheduled_at` is required and must be in the future on
  create; new row starts `status = scheduled`. For `mode=youtube` the broadcast
  is provisioned immediately (so the teacher has the RTMP URL / key ahead of
  time) with `scheduledStartTime = scheduled_at`.
- **Reschedule** is just `PATCH {id}` with a new `scheduled_at` (only allowed
  while `status = scheduled`). For `mode=youtube`, the server also patches the
  broadcast's `scheduledStartTime` via `liveBroadcasts.update`.

### 6.3 Activities (Activity Planner)

Nested under a class. Prefix `/api/v1/live-classes/{classId}/activities`.

| Method | Path                       | Body / notes |
|--------|----------------------------|--------------|
| GET    | `/`                        | List all activities for the class (drafts + others), ordered by `position`. Returns `{ data: [activity…] }` (pagination optional — counts are small). |
| POST   | `/`                        | Create a poll or quiz draft. Body = the §5 shape minus server fields (`type`, `title`, `payload`, optional `duration_minutes`, `position`). Returns the full activity. |
| GET    | `/{activityId}`            | Single activity. |
| PATCH  | `/{activityId}`            | Partial update (edit options/questions, reorder via `position`). |
| DELETE | `/{activityId}`            | Delete the activity (hard or soft). |

Create body examples:

```jsonc
// poll
{ "type": "poll", "title": "Is everyone able to hear me clearly?",
  "payload": { "options": ["Yes", "No"] } }

// quiz
{ "type": "quiz", "title": "End of Session Exam", "duration_minutes": 10,
  "payload": { "questions": [
    { "question": "…", "image_url": null,
      "options": ["A","B","C","D"], "correct_index": 2 }
  ] } }
```

### 6.4 YouTube provisioning (new)

Provisioning creates the broadcast + stream and binds them. It normally runs
automatically inside `POST /` for `mode=youtube`. These endpoints cover retry,
regeneration, and status refresh.

| Method | Path                          | Body / notes |
|--------|-------------------------------|--------------|
| POST   | `/{id}/youtube/provision`     | Create (or re-create) and bind the broadcast + stream for this class. Idempotent: if already provisioned and `?force=false` (default), returns the existing `youtube` object; with `?force=true` it tears down the old broadcast and provisions fresh (new stream key). Only valid for `mode=youtube`; otherwise `INVALID_STATE_TRANSITION` 409. Returns the updated class (admin view). |
| POST   | `/{id}/youtube/rotate-key`    | Regenerate **only** the stream key (`liveStreams.insert` + re-`bind`) without changing `broadcast_id` / watch / embed URLs. Use if a key leaks. Returns updated class. |
| GET    | `/{id}/youtube/credentials`   | Admin/host-only. Returns just `{ rtmp_url, rtmp_backup_url, stream_key, embed_url, watch_url }` for the OBS setup screen. 403 for non-admins; secrets per §4.2. |
| POST   | `/{id}/youtube/sync`          | Pull the current broadcast `lifeCycleStatus` from YouTube into `youtube_lifecycle_status` and reconcile internal `status` (e.g. mark `completed` if YouTube auto-stopped). Returns updated class. Safe to call from a poller. |

**Server steps performed during provisioning** (§12.2 has detail):
1. `liveBroadcasts.insert` — `snippet.title`, `snippet.scheduledStartTime`,
   `status.privacyStatus="unlisted"`, `status.selfDeclaredMadeForKids=false`,
   `contentDetails.enableAutoStart`, `contentDetails.enableAutoStop`,
   `contentDetails.latencyPreference="low"`, embeddable. → `broadcast_id`.
2. `liveStreams.insert` — `cdn.ingestionType="rtmp"`, resolution/frameRate
   `variable`. → `stream_id`, `cdn.ingestionInfo.ingestionAddress` (`rtmp_url`),
   `cdn.ingestionInfo.streamName` (`stream_key`).
3. `liveBroadcasts.bind` — bind `broadcast_id` ↔ `stream_id`.
4. Derive `watch_url` / `embed_url` from `broadcast_id`; persist all fields and
   `youtube_provisioned_at = now()`.

On any failure the class row still exists (created in step 0) with
`youtube_provisioned_at = null`; the response carries the relevant §10 error and
the FE shows a "Provision stream" / "Retry" action that calls
`POST /{id}/youtube/provision`.

---

## 7. Related reports (referenced by the kebab menu, optional/out-of-scope here)

The scheduler's row menu links to features owned by other contracts. Listed for
completeness; not part of this module's required surface:

- **View Attendance Report** → attendance module.
- **Feedback Summary** (completed classes) → feedback module; the `rating` field
  on the class (§4) is the headline number it aggregates.
- **Plan Activity** → §6.3 above.

---

## 8. RBAC permissions

The FE already gates these pages on the following permission keys
(`src/lib/permissions.js`, `src/lib/legacyScreens.js`):

| Permission         | Scope  | Guards |
|--------------------|--------|--------|
| `liveClass.view`   | global | list / read classes & activities. Does **not** include YouTube secret fields (§4.2). |
| `liveClass.edit`   | global | create / update / cancel / launch / end / activity writes / **YouTube provision, rotate-key, credentials, sync** (§6.4). |

Map all read endpoints to `liveClass.view` and every mutating endpoint to
`liveClass.edit`. The secret YouTube fields and `/youtube/credentials` require
`liveClass.edit` (or being the class host) regardless of `liveClass.view`.

---

## 9. Validation rules (Form Request)

```php
// StoreLiveClassRequest / UpdateLiveClassRequest (use 'sometimes' on update)
[
  'title'              => ['required','string','max:200'],
  'host_id'            => ['nullable','ulid'],
  'host_name'          => ['required_without:host_id','string','max:160'],
  'participants_label' => ['required','string','max:160'],
  'audience_type'      => ['nullable','in:all,unrestricted,batch,course'],
  'audience_ref'       => ['nullable','string','max:160'],
  'mode'               => ['required','in:system,youtube'], // immutable on update (§3.2)
  'is_instant'         => ['boolean'],
  'scheduled_at'       => ['required_if:is_instant,false','date'],
  'duration_label'     => ['nullable','string','max:40'],
  'duration_minutes'   => ['nullable','integer','min:1','max:1440'],
  'strict_moderation'  => ['boolean'],
  'auto_feedback'      => ['boolean'],
  'webinar_mode'       => ['boolean'],
  'ask_to_join'        => ['boolean'],
  // NOTE: all youtube_* fields are server-populated and are rejected/ignored
  //       if present in the request body. Do NOT add them to fillable input.
]

// On UPDATE: reject a changed mode
//   if ($class->mode !== $request->input('mode', $class->mode)) -> 409 INVALID_STATE_TRANSITION

// StoreLiveClassActivityRequest
[
  'type'                       => ['required','in:poll,quiz'],
  'title'                      => ['required','string','max:300'],
  'duration_minutes'           => ['required_if:type,quiz','nullable','integer','min:1','max:120'],
  // poll
  'payload.options'            => ['required_if:type,poll','array','min:2','max:8'],
  'payload.options.*'          => ['string','max:300'],
  // quiz
  'payload.questions'          => ['required_if:type,quiz','array','min:1'],
  'payload.questions.*.question'      => ['required','string'],
  'payload.questions.*.image_url'     => ['nullable','url','max:2048'],
  'payload.questions.*.options'       => ['array','size:4'],
  'payload.questions.*.options.*'     => ['required','string','max:300'],
  'payload.questions.*.correct_index' => ['required','integer','min:0','max:3'],
  'position'                   => ['nullable','integer','min:0'],
]
```

---

## 10. Errors

Standard envelope and codes (same as the signage contract §11):

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "…", "details": { } } }
```

Generic: `VALIDATION_FAILED` 422 · `NOT_FOUND` 404 · `FORBIDDEN` 403 ·
`SERVER_ERROR` 500.

State transitions:
- `INVALID_STATE_TRANSITION` 409 — e.g. `launch` on a non-`scheduled` class,
  `end` on a non-`live` class, reschedule on a class that already started, a
  changed `mode` on update, or `youtube/*` on a `system` class.

YouTube integration (new):
- `YOUTUBE_PROVISION_FAILED` 502 — `liveBroadcasts.insert` / `liveStreams.insert`
  / `bind` failed. `details` carries the upstream reason where safe (never the
  stream key).
- `YOUTUBE_QUOTA_EXCEEDED` 429 — Data API daily quota exhausted (§12.6). The FE
  should surface "try again later / contact admin".
- `YOUTUBE_NOT_PROVISIONED` 409 — `launch` / `credentials` / `rotate-key`
  requested before provisioning succeeded; call `POST /{id}/youtube/provision`.
- `YOUTUBE_TRANSITION_FAILED` 409 — manual `launch`/`end` could not transition
  the broadcast (commonly: stream not yet receiving data — start OBS first).
- `YOUTUBE_AUTH_FAILED` 502 — the platform's stored YouTube OAuth token is
  missing/expired/revoked; an operator must re-authorise the channel (§12.1).

---

## 11. Front-end integration note

There is **no API client wired yet** — both pages (`LiveClassSchedulerPage.jsx`,
`LiveClassActivityPlannerPage.jsx`) currently use in-component demo state. When
the backend lands, add a `src/lib/liveClassApi.js` mirroring the field names in
§4/§5/§6.2 (snake_case on the wire) and replace the demo arrays.

YouTube-specific FE work introduced by this revision:
- The create dialog already offers a **"YouTube Live"** mode. On a successful
  `mode=youtube` create, show the **OBS setup panel** with the RTMP URL +
  stream key (from `youtube.rtmp_url` / `youtube.stream_key`, or
  `GET /{id}/youtube/credentials`), a copy-to-clipboard control, and a masked
  stream key by default.
- If `youtube.provisioned_at` is `null` for a `youtube` class, render a
  **"Provision stream / Retry"** button → `POST /{id}/youtube/provision`, and
  surface §10 YouTube errors inline.
- Provide a **"Rotate stream key"** action (→ `/youtube/rotate-key`) guarded by a
  confirm, since it invalidates the key currently in OBS.
- The monitor view may poll `POST /{id}/youtube/sync` (or read
  `youtube.lifecycle_status`) to show whether YouTube is actually receiving the
  stream.
- **Never** render `rtmp_url` / `stream_key` anywhere a non-`liveClass.edit` user
  can see them, and never put them in URLs or analytics.

No other FE contract is implied by the current screens.

---

## 12. YouTube Live integration (implementation notes)

This section is informative — it documents the integration the §2/§4/§6 contract
assumes. It is the responsibility of a server-side `YouTubeLiveService`.

### 12.1 Channel ownership & auth
Broadcast/stream creation is **not** possible with a public API key — it requires
**OAuth 2.0** acting on behalf of a Google account that owns the platform's
YouTube channel, with the `https://www.googleapis.com/auth/youtube` (or
`youtube.force-ssl`) scope. Store a long-lived **refresh token** for that single
platform channel server-side (encrypted, e.g. in a config table or secrets
manager) and exchange it for access tokens as needed. Operators re-authorise via
a one-time admin OAuth flow; a missing/expired token surfaces as
`YOUTUBE_AUTH_FAILED` (§10). All classes share this one channel.

### 12.2 Provisioning (Data API v3)
Per §6.4: `liveBroadcasts.insert` → `liveStreams.insert` → `liveBroadcasts.bind`.
Recommended broadcast settings: `privacyStatus="unlisted"`,
`selfDeclaredMadeForKids=false`, embeddable, `enableAutoStart=true`,
`enableAutoStop=true`, `latencyPreference="low"`. Stream: `ingestionType="rtmp"`,
`resolution`/`frameRate` = `variable`. The OBS **Server** = `ingestionAddress`,
**Stream Key** = `streamName`.

### 12.3 Auto vs. manual go-live
With `enableAutoStart`/`enableAutoStop` the broadcast follows OBS — it goes
`live` when ingest begins and `complete` when it stops, so our `launch`/`end`
endpoints mainly maintain internal `status`. Set the per-environment default in
config; manual transition (explicit `liveBroadcasts.transition`) is available for
studios that want our buttons to drive YouTube directly (§6.1).

### 12.4 Lifecycle reconciliation
YouTube broadcast `lifeCycleStatus` values (`created`, `ready`, `testing`,
`live`, `complete`, `revoked`) are stored in `youtube_lifecycle_status` and are
**separate** from our `status`. Reconcile via `POST /{id}/youtube/sync` (poll at
a modest interval during a live class) and at launch/end. Our `status` is what
the FE renders; `youtube_lifecycle_status` is diagnostic.

### 12.5 Access-control caveat (Unlisted)
Unlisted means **anyone with the link can watch** — there is no per-viewer
YouTube ACL. Our app enforces who *sees the player in our apps* via the class
audience (§3.3) and auth, but it cannot stop a student who extracts the
`embed_url`/`watch_url` from sharing it outside the app. This is an accepted
trade-off for scale. Mitigations: only ship `embed_url` to authorised viewers,
never expose the broadcast id in public surfaces, rotate per class (a fresh
broadcast id per class limits link reuse), and treat true per-viewer gating as
the trigger to migrate to LiveKit / AWS IVS. Do **not** rely on Unlisted for
confidential content.

### 12.6 Quota & latency
The Data API has a default project quota (~10,000 units/day);
`liveBroadcasts.insert`, `liveStreams.insert`, and `bind` each cost on the order
of ~50 units, so routine class creation is comfortably within budget — but bulk
or repeated `force` re-provisioning can exhaust it, surfaced as
`YOUTUBE_QUOTA_EXCEEDED` (§10). Request a quota increase before large rollouts.
Note YouTube Live carries inherent delivery latency (seconds, even in low-latency
mode); the real-time chat plane (Reverb) will be ahead of the video — design the
classroom UX accordingly.
