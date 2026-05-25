# Digital Signage + Smart Kiosk CMS — Data Model & API Contract

Target stack: **PHP 8.4 / Laravel 11+ / MySQL 8.x / Redis / Pusher or Laravel Reverb (WebSockets)**

This document is the complete contract the React admin (`/digital-signage`) and
the kiosk player (`/player/<screen_code>`) expect. Implement exactly the
shapes and endpoints below and the two front-ends will work without changes.

---

## 0. Conventions

| Topic              | Convention                                                                                |
|--------------------|--------------------------------------------------------------------------------------------|
| IDs                | **ULID** strings (26 chars). Use Laravel `HasUlids` trait. Public-facing in URLs.         |
| Timestamps         | ISO 8601 UTC strings (`2026-05-25T09:30:00Z`). Always serialise with `->toIso8601String()`.|
| Money              | n/a in this module.                                                                       |
| Booleans           | JSON `true`/`false`, never `0`/`1`.                                                       |
| Enums              | UPPER_SNAKE strings, validated against fixed allow-lists (see §3).                        |
| Pagination         | `?page=1&per_page=25` → `{ data: [...], meta: { page, per_page, total, last_page } }`.    |
| Filtering          | Query string. Multiple values comma-separated: `?branch_id=br1,br2`.                       |
| Sorting            | `?sort=-created_at` (prefix `-` = desc).                                                  |
| Errors             | See §11.                                                                                  |
| Auth header        | `Authorization: Bearer <token>`.                                                          |
| Idempotency        | Mutating endpoints accept optional `Idempotency-Key` header.                              |
| Soft deletes       | All entities use `deleted_at` (Laravel `SoftDeletes`).                                    |

API base path: `/api/v1/signage`

---

## 1. Authentication & Authorisation

### 1.1 Admin auth

Use the existing app-wide token (whatever the admin SPA already sends — likely a Sanctum personal access token). No new auth scheme.

### 1.2 Player auth

The player runs on shared/public devices, so we issue **per-screen device tokens** at pairing time.

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/signage/player/pair` | Body: `{ screen_code, pairing_code }`. Returns `{ screen_token }` (long-lived JWT, sub = screen_id). |
| `POST /api/v1/signage/player/unpair` | Bearer screen_token. Invalidates the token. |

The admin generates `pairing_code` (6-digit numeric, 24h TTL) when first creating a Screen. The on-screen UI of the player prompts the user to enter this once.

All player endpoints below require `Authorization: Bearer <screen_token>` **except** `pair`.

### 1.3 RBAC permissions

Add to your existing `permissions` table:

| Permission                              | Scope                          |
|-----------------------------------------|--------------------------------|
| `signage.branches.view`                 | global                         |
| `signage.branches.manage`               | global                         |
| `signage.screens.view`                  | branch-scoped                  |
| `signage.screens.manage`                | branch-scoped                  |
| `signage.screens.assign_loop`           | branch-scoped                  |
| `signage.loops.view`                    | branch-scoped or global loops  |
| `signage.loops.manage`                  | branch-scoped or global loops  |
| `signage.schedules.view`                | branch-scoped                  |
| `signage.schedules.manage`              | branch-scoped                  |
| `signage.alerts.view`                   | branch-scoped                  |
| `signage.alerts.broadcast`              | branch-scoped                  |
| `signage.media.view`                    | branch-scoped or global media  |
| `signage.media.manage`                  | branch-scoped or global media  |

Suggested role bundles:

- `SIGNAGE_SUPER_ADMIN` — everything (cross-branch).
- `SIGNAGE_BRANCH_ADMIN` — everything scoped to one or more `branch_id`s.
- `SIGNAGE_CONTENT_MANAGER` — loops + media + alerts (no branches/screens).
- `SIGNAGE_VIEWER` — `.view` only.

"Branch-scoped" means: for any list endpoint, automatically filter by the user's allowed `branch_id`s. For any read/write of a specific entity, deny if its `branch_id` is outside that set. Entities with `branch_id = null` are **global** and visible/editable only by users who have the un-scoped permission.

---

## 2. Database schema

Naming convention: `signage_*` prefix on all tables to namespace cleanly within the existing schema.

### 2.1 `signage_branches`

```sql
CREATE TABLE signage_branches (
  id            CHAR(26)  PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  code          VARCHAR(16)  NOT NULL UNIQUE,        -- 'KCH', 'CHE', 'BLR'
  city          VARCHAR(120) NULL,
  timezone      VARCHAR(64)  NOT NULL DEFAULT 'Asia/Kolkata',
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  deleted_at    TIMESTAMP NULL,
  INDEX (active)
);
```

### 2.2 `signage_media`

```sql
CREATE TABLE signage_media (
  id            CHAR(26)  PRIMARY KEY,
  branch_id     CHAR(26)  NULL,                       -- NULL = global asset
  name          VARCHAR(255) NOT NULL,
  type          ENUM('image','video','lottie','audio') NOT NULL,
  mime_type     VARCHAR(96)  NOT NULL,
  size_bytes    BIGINT       NOT NULL,
  storage_disk  VARCHAR(32)  NOT NULL DEFAULT 's3',
  storage_path  VARCHAR(512) NOT NULL,
  cdn_url       VARCHAR(512) NULL,
  thumbnail_url VARCHAR(512) NULL,
  width         INT NULL,
  height        INT NULL,
  duration_ms   INT NULL,                             -- for video / audio / lottie
  tags          JSON NULL,                            -- ["logo","intro"]
  uploaded_by_user_id BIGINT NULL,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  deleted_at    TIMESTAMP NULL,
  FOREIGN KEY (branch_id) REFERENCES signage_branches(id) ON DELETE SET NULL,
  INDEX (branch_id),
  INDEX (type)
);
```

### 2.3 `signage_screens`

```sql
CREATE TABLE signage_screens (
  id                    CHAR(26) PRIMARY KEY,
  branch_id             CHAR(26) NOT NULL,
  name                  VARCHAR(120) NOT NULL,
  screen_code           VARCHAR(32)  NOT NULL UNIQUE,  -- 'KCH-R01' (also player URL slug)
  pairing_code          VARCHAR(8)   NULL,             -- one-time, NULL after paired
  pairing_expires_at    TIMESTAMP    NULL,
  paired_at             TIMESTAMP    NULL,
  resolution            VARCHAR(16)  NOT NULL DEFAULT '1920x1080',
  orientation           ENUM('landscape','portrait') NOT NULL DEFAULT 'landscape',
  timezone              VARCHAR(64)  NOT NULL DEFAULT 'Asia/Kolkata',
  device_status         ENUM('online','offline','warning') NOT NULL DEFAULT 'offline',
  playback_status       ENUM('playing','idle','paused','error') NOT NULL DEFAULT 'idle',
  last_seen_at          TIMESTAMP    NULL,
  assigned_loop_id      CHAR(26)     NULL,
  ip_address            VARCHAR(45)  NULL,
  user_agent            VARCHAR(255) NULL,
  player_version        VARCHAR(32)  NULL,
  created_at            TIMESTAMP NULL,
  updated_at            TIMESTAMP NULL,
  deleted_at            TIMESTAMP NULL,
  FOREIGN KEY (branch_id)        REFERENCES signage_branches(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_loop_id) REFERENCES signage_loops(id)    ON DELETE SET NULL,
  INDEX (branch_id),
  INDEX (device_status),
  INDEX (assigned_loop_id)
);
```

### 2.4 `signage_loops` (admin terminology: "loop" — internally was "timeline")

```sql
CREATE TABLE signage_loops (
  id                          CHAR(26) PRIMARY KEY,
  branch_id                   CHAR(26) NULL,            -- NULL = global loop
  name                        VARCHAR(160) NOT NULL,
  description                 TEXT NULL,
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  auto_replay                 BOOLEAN NOT NULL DEFAULT TRUE,   -- "loop_enabled" in seed data
  emergency_override_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id          BIGINT NULL,
  created_at                  TIMESTAMP NULL,
  updated_at                  TIMESTAMP NULL,
  deleted_at                  TIMESTAMP NULL,
  FOREIGN KEY (branch_id) REFERENCES signage_branches(id) ON DELETE CASCADE,
  INDEX (branch_id),
  INDEX (is_active)
);
```

### 2.5 `signage_loop_items`

```sql
CREATE TABLE signage_loop_items (
  id                         CHAR(26) PRIMARY KEY,
  loop_id                    CHAR(26) NOT NULL,
  position                   INT NOT NULL,                       -- 0-based; reorder rewrites this column
  title                      VARCHAR(200) NOT NULL,
  content_type               VARCHAR(32)  NOT NULL,              -- see §3 enum
  media_id                   CHAR(26) NULL,                      -- FK for media-backed types
  payload                    JSON NULL,                          -- content-type specific config (see §4)
  duration_seconds           INT NOT NULL DEFAULT 15,
  transition_type            VARCHAR(16) NOT NULL DEFAULT 'fade',
  background_audio_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  overlay_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_constraints       JSON NULL,                          -- {"days":["mon"...], "from":"09:00","to":"12:00"}
  created_at                 TIMESTAMP NULL,
  updated_at                 TIMESTAMP NULL,
  FOREIGN KEY (loop_id)  REFERENCES signage_loops(id)  ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES signage_media(id)  ON DELETE SET NULL,
  INDEX (loop_id, position)
);
```

### 2.6 `signage_schedules`

```sql
CREATE TABLE signage_schedules (
  id           CHAR(26)  PRIMARY KEY,
  name         VARCHAR(160) NOT NULL,
  loop_id      CHAR(26)  NOT NULL,
  days         JSON      NOT NULL,                          -- ["mon","tue",...]
  start_time   TIME      NOT NULL,
  end_time     TIME      NOT NULL,
  start_date   DATE      NOT NULL,
  end_date     DATE      NULL,
  priority     SMALLINT  NOT NULL DEFAULT 5,                -- higher wins
  is_active    BOOLEAN   NOT NULL DEFAULT TRUE,
  created_by_user_id BIGINT NULL,
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL,
  deleted_at   TIMESTAMP NULL,
  FOREIGN KEY (loop_id) REFERENCES signage_loops(id) ON DELETE CASCADE,
  INDEX (loop_id),
  INDEX (is_active, start_date, end_date)
);

CREATE TABLE signage_schedule_screen (
  schedule_id CHAR(26) NOT NULL,
  screen_id   CHAR(26) NOT NULL,
  PRIMARY KEY (schedule_id, screen_id),
  FOREIGN KEY (schedule_id) REFERENCES signage_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (screen_id)   REFERENCES signage_screens(id)   ON DELETE CASCADE
);
```

### 2.7 `signage_alerts` (emergency broadcasts)

```sql
CREATE TABLE signage_alerts (
  id            CHAR(26) PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  message       TEXT NULL,
  severity      ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  audio_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ticker_text   VARCHAR(500) NULL,
  start_time    TIMESTAMP NOT NULL,
  end_time      TIMESTAMP NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id BIGINT NULL,
  broadcast_at  TIMESTAMP NULL,
  dismissed_at  TIMESTAMP NULL,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  deleted_at    TIMESTAMP NULL,
  INDEX (is_active),
  INDEX (start_time, end_time)
);

CREATE TABLE signage_alert_branch (
  alert_id  CHAR(26) NOT NULL,
  branch_id CHAR(26) NOT NULL,
  PRIMARY KEY (alert_id, branch_id),
  FOREIGN KEY (alert_id)  REFERENCES signage_alerts(id)   ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES signage_branches(id) ON DELETE CASCADE
);

CREATE TABLE signage_alert_screen (
  alert_id  CHAR(26) NOT NULL,
  screen_id CHAR(26) NOT NULL,
  PRIMARY KEY (alert_id, screen_id),
  FOREIGN KEY (alert_id)  REFERENCES signage_alerts(id)  ON DELETE CASCADE,
  FOREIGN KEY (screen_id) REFERENCES signage_screens(id) ON DELETE CASCADE
);
```

When **both** `alert_branch` and `alert_screen` are empty, treat the alert as **global** (all screens, all branches).

### 2.8 `signage_heartbeats` (optional, for diagnostics — keep last 24h)

```sql
CREATE TABLE signage_heartbeats (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  screen_id   CHAR(26) NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address  VARCHAR(45) NULL,
  player_version VARCHAR(32) NULL,
  playback_status VARCHAR(16) NULL,
  current_item_id CHAR(26) NULL,
  INDEX (screen_id, received_at)
);
```

### 2.9 `signage_check_ins` (biometric events — feeds CHECKIN_FEED overlay)

This is read-only from this module's perspective; data is produced by the existing attendance system. Most likely it's already a view over your attendance table. If not, define:

```sql
CREATE TABLE signage_check_ins (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id    CHAR(26) NOT NULL,
  student_id   BIGINT   NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  checked_in_at TIMESTAMP NOT NULL,
  INDEX (branch_id, checked_in_at)
);
```

---

## 3. Enums (validated allow-lists)

```php
const CONTENT_TYPES = [
  'BRANDING','LIVE_CLASSES','FACULTY_SCHEDULE','ATTENDANCE',
  'CHECKIN_FEED','TESTIMONIALS','TOPPERS','COUNTDOWN',
  'EMERGENCY','AI_HIGHLIGHTS','VIDEO','POSTER',
];

const CONTENT_TYPE_SCOPES = [   // server-rendered hydration policy
  'BRANDING' => 'GLOBAL',
  'LIVE_CLASSES' => 'CENTER',
  'FACULTY_SCHEDULE' => 'CENTER',
  'ATTENDANCE' => 'CENTER',
  'CHECKIN_FEED' => 'CENTER',
  'TESTIMONIALS' => 'GLOBAL',
  'TOPPERS' => 'GLOBAL',
  'COUNTDOWN' => 'GLOBAL',
  'EMERGENCY' => 'CENTER',
  'AI_HIGHLIGHTS' => 'CENTER',
  'VIDEO' => 'GLOBAL',
  'POSTER' => 'CENTER',
];

const TRANSITIONS = ['fade','slide','zoom','blur','wipe','cinematic'];
const SEVERITIES  = ['info','warning','critical'];
const ORIENTATIONS= ['landscape','portrait'];
const WEEKDAYS    = ['mon','tue','wed','thu','fri','sat','sun'];
const MEDIA_TYPES = ['image','video','lottie','audio'];
```

GLOBAL types render from `payload`/`media_id` exactly as the admin authored.
CENTER types render from **server-hydrated** data pulled from the branch's own data sources (attendance API, classes table, etc.) — the `payload` for CENTER items just holds display preferences.

Expose this catalog at `GET /api/v1/signage/content-types` so the front-end never hard-codes it.

---

## 4. Content `payload` shapes per type

The admin saves these as-is to `signage_loop_items.payload`. The player API merges them with the hydrated server data and returns the result as `data` in the player payload (§7).

```ts
// BRANDING (GLOBAL)
{ title?: string, subtitle?: string, cta?: string,
  background_style?: 'gradient'|'particles'|'video', animation_preset?: string,
  stats?: Array<{label: string, value: string}> }

// LIVE_CLASSES (CENTER) — payload only holds display prefs
{ max_rows?: number, group_by?: 'room'|'faculty'|null }
// hydrated `classes`: [{ class_name, room, faculty, start_time, end_time, status }]

// FACULTY_SCHEDULE (CENTER)
{ max_rows?: number }
// hydrated `entries`: [{ faculty_name, subject, timing, classroom, status }]

// ATTENDANCE (CENTER)
{ show_late?: boolean }
// hydrated: { present, absent, late, total, as_of: iso }

// CHECKIN_FEED (CENTER) — overlay only, not a slide; payload unused
{}

// TESTIMONIALS (GLOBAL)
{ entries: [{ name, photo_url?, quote, rating?: 1-5, course? }],
  qr_url?: string, qr_label?: string }

// TOPPERS (GLOBAL)
{ entries: [{ name, photo_url?, rank, exam, college?, year? }],
  layout?: 'grid'|'hero' }

// COUNTDOWN (GLOBAL)
{ title: string, subtitle?: string, target: iso8601, theme?: 'dark'|'light' }

// EMERGENCY (CENTER, also pushed via socket override)
{ title: string, message: string, ticker?: string }

// AI_HIGHLIGHTS (CENTER) — server fills `entries` and `charts`
{ window: 'week'|'month' }
// hydrated: { entries: [{name, metric, caption}], charts: [...] }

// VIDEO (GLOBAL)
{ url?: string,             // OR use media_id
  poster_url?: string,
  autoplay?: boolean,       // default true
  loop?: boolean,           // default true
  mute?: boolean }          // default true

// POSTER (CENTER — branch-targeted artwork)
{ title?: string, subtitle?: string, cta?: string, image_url?: string, animation?: string }
```

---

## 5. Admin REST API

All routes prefix: `/api/v1/signage`. Add Sanctum middleware + RBAC policy checks.

### 5.1 Dashboard

| Method | Path           | Returns |
|--------|----------------|---------|
| GET    | `/dashboard`   | `{ branches: [...], counts: {screens_total, online, offline, warning, playing, loops, active_schedules, active_alerts}, storage_bytes, now_playing: [{screen, loop, current_item}] }` |

### 5.2 Branches

| Method | Path                         | Body / notes                                       |
|--------|------------------------------|----------------------------------------------------|
| GET    | `/branches`                  | List. Query: `?active=true&search=...`             |
| POST   | `/branches`                  | `{ name, code, city?, timezone? }`                 |
| GET    | `/branches/{id}`             |                                                    |
| PATCH  | `/branches/{id}`             | partial                                            |
| DELETE | `/branches/{id}`             | soft delete; 409 if it has screens                 |

### 5.3 Screens

| Method | Path                                       | Notes |
|--------|--------------------------------------------|-------|
| GET    | `/screens`                                 | `?branch_id=`, `?status=online,offline`, `?search=`. Returns paginated. |
| POST   | `/screens`                                 | `{ branch_id, name, screen_code?, resolution?, orientation?, timezone?, assigned_loop_id? }`. Server generates `screen_code` if omitted and a `pairing_code`. |
| GET    | `/screens/{id}`                            | Includes `pairing_code` only if not yet paired. |
| PATCH  | `/screens/{id}`                            | |
| DELETE | `/screens/{id}`                            | |
| POST   | `/screens/{id}/regenerate-pairing-code`    | Returns new pairing_code; revokes any existing screen_token. |
| POST   | `/screens/{id}/assign-loop`                | `{ loop_id }` (nullable to unassign). Emits realtime event `screen:reload`. |
| POST   | `/screens/bulk-assign-loop`                | `{ screen_ids: [...], loop_id }`. |
| POST   | `/screens/{id}/restart`                    | Pushes a `screen:restart` socket event. |

### 5.4 Loops (timelines)

| Method | Path                                | Notes |
|--------|-------------------------------------|-------|
| GET    | `/loops`                            | `?branch_id=`, `?is_active=`, `?search=` |
| POST   | `/loops`                            | `{ branch_id?, name, description?, is_active?, auto_replay?, emergency_override_enabled? }` |
| GET    | `/loops/{id}`                       | Includes `items` ordered by `position` |
| PATCH  | `/loops/{id}`                       | partial |
| DELETE | `/loops/{id}`                       | screens using it become unassigned (set null) |
| POST   | `/loops/{id}/duplicate`             | Returns the new loop |
| POST   | `/loops/{id}/items`                 | Append item. Body = §4 + `{ content_type, duration_seconds?, transition_type?, title?, media_id?, payload? }` |
| PATCH  | `/loops/{id}/items/{item_id}`       | |
| DELETE | `/loops/{id}/items/{item_id}`       | |
| POST   | `/loops/{id}/items/{item_id}/duplicate` | Inserts the copy right after the original. |
| POST   | `/loops/{id}/items/reorder`         | `{ ordered_ids: [...] }` — server rewrites `position` in one tx and emits `screen:reload` to all screens using this loop. |
| POST   | `/loops/{id}/items/bulk-duration`   | `{ duration_seconds: int }` |

### 5.5 Schedules

| Method | Path                  | Notes |
|--------|-----------------------|-------|
| GET    | `/schedules`          | `?branch_id=` (via loop), `?is_active=` |
| POST   | `/schedules`          | `{ name, loop_id, screen_ids: [...], days: [...], start_time, end_time, start_date, end_date?, priority?, is_active? }` |
| GET    | `/schedules/{id}`     | |
| PATCH  | `/schedules/{id}`     | |
| DELETE | `/schedules/{id}`     | |

Schedule resolution algorithm (server-side, run by the player API):

```
For a screen at time T:
  matches = active schedules where
              screen_id is in schedule.screen_ids
              AND T's date ∈ [start_date, end_date]
              AND T's weekday ∈ days
              AND T's local time ∈ [start_time, end_time]
  effective_loop = highest-priority match, else screen.assigned_loop_id
```

### 5.6 Alerts (emergency)

| Method | Path                          | Notes |
|--------|-------------------------------|-------|
| GET    | `/alerts`                     | `?is_active=`, `?severity=`, `?branch_id=` |
| POST   | `/alerts`                     | `{ title, message?, severity, branch_ids?, screen_ids?, audio_enabled?, ticker_text?, start_time, end_time, is_active? }` |
| GET    | `/alerts/{id}`                | |
| PATCH  | `/alerts/{id}`                | |
| DELETE | `/alerts/{id}`                | |
| POST   | `/alerts/{id}/broadcast`      | Sets `is_active=true`, `broadcast_at=now()`, fires `emergency:<branch>` socket event to every targeted screen. |
| POST   | `/alerts/{id}/dismiss`        | Sets `is_active=false`, `dismissed_at=now()`, fires `emergency:dismiss` to clear overlays. |

### 5.7 Media

| Method | Path                  | Notes |
|--------|-----------------------|-------|
| GET    | `/media`              | `?branch_id=`, `?type=`, `?tag=`, `?search=`. Returns `uses` (count of `signage_loop_items.media_id = this.id`). |
| POST   | `/media`              | `multipart/form-data`: `file`, `branch_id?`, `tags?[]`. Returns full media row. Server generates thumbnail + extracts metadata. |
| GET    | `/media/{id}`         | |
| PATCH  | `/media/{id}`         | metadata only (name, tags, branch_id) |
| DELETE | `/media/{id}`         | 409 if `uses > 0` unless `?force=true` |

### 5.8 Content types catalog

| Method | Path                | Notes |
|--------|---------------------|-------|
| GET    | `/content-types`    | Returns the array in §3 plus `label`, `description`, `icon`, `scope`. |

---

## 6. Player REST API

Prefix: `/api/v1/signage/player`. Player auth (screen token) required except for `pair`.

| Method | Path                                  | Notes |
|--------|---------------------------------------|-------|
| POST   | `/pair`                               | Body: `{ screen_code, pairing_code }`. Returns `{ screen_token, screen: {...} }`. Single use. |
| GET    | `/screens/{screen_code}`              | The full hydrated payload below. **This is what the kiosk player polls.** |
| POST   | `/screens/{screen_code}/heartbeat`    | Body: `{ ts: int, current_item_id?, playback_status?, player_version?, user_agent? }`. Returns `{ ok: true, server_time, config_version }`. |
| GET    | `/screens/{screen_code}/loop`         | Only the resolved loop (lighter response if `config_version` unchanged) |
| GET    | `/screens/{screen_code}/alerts`       | Active alerts targeted at this screen |

### 6.1 Hydrated player payload

`GET /api/v1/signage/player/screens/{screen_code}` →

```json
{
  "config_version": "8d2c…",            // hash of (loop + alerts) — used by player for diffing
  "server_time":    "2026-05-25T09:30:00Z",
  "screen": {
    "id":          "01J…",
    "screen_code": "KCH-R01",
    "name":        "Reception TV",
    "branch_id":   "01J…",
    "branch_name": "Kochi",
    "resolution":  "1920x1080",
    "orientation": "landscape",
    "timezone":    "Asia/Kolkata"
  },
  "loop": {
    "id":          "01J…",
    "name":        "Morning Branding Loop",
    "auto_replay": true,
    "items": [
      {
        "id": "01J…",
        "content_type": "ATTENDANCE",
        "duration_seconds": 15,
        "transition_type": "slide",
        "title": "Today's Attendance",
        "media_url": null,
        "data": { "present": 412, "absent": 23, "late": 8, "total": 443, "as_of": "2026-05-25T09:29:55Z" }
      },
      { "id": "01J…", "content_type": "TOPPERS", "duration_seconds": 20, "transition_type": "cinematic", "title": "Hall of Fame",
        "media_url": "https://cdn…/topper-hero.jpg",
        "data": { "entries": [...] } }
    ]
  },
  "alerts": []
}
```

Rules for `data`:
- GLOBAL types: `data` = the saved `payload` verbatim, plus `media_url` if `media_id` set.
- CENTER types: `data` = server-side hydration from branch data sources (see §4).
- If hydration fails (eg attendance system down), include `data.error: "string"` and the player will show a graceful fallback.

`config_version` should be a SHA-1 of the JSON-serialised loop+alerts. Player sends it on subsequent polls as `If-None-Match`; respond `304` if unchanged.

---

## 7. Realtime channels (WebSockets)

Use Laravel Reverb or Pusher. Channels are **private** for admin, **presence** for screens (so we know who is connected).

### Channels

| Channel name                  | Audience              | Events fired                                       |
|-------------------------------|-----------------------|----------------------------------------------------|
| `presence-signage.screens`    | admins                | `screen.online`, `screen.offline`, `screen.heartbeat` |
| `private-signage.screen.{id}` | a single player       | `loop.reload`, `restart`, `emergency.show`, `emergency.dismiss` |
| `private-signage.branch.{id}` | players in branch     | `checkin.new`, `emergency.show`, `emergency.dismiss` |
| `private-signage.branch.{id}.admin` | admins of branch | `loop.updated`, `screen.heartbeat`, `alert.broadcast` |

### Event payloads

```jsonc
// loop.reload  → tell screen to refetch its loop
{ "screen_id": "01J…", "loop_id": "01J…", "reason": "items_reordered" }

// emergency.show
{ "alert_id": "01J…", "title": "...", "message": "...",
  "severity": "critical", "ticker": "...", "end_time": "iso" }

// emergency.dismiss
{ "alert_id": "01J…" }

// checkin.new  → drives the floating overlay
{ "id": "evt-…", "branch_id": "01J…", "student_id": 4321,
  "name": "Ajinkya", "message": "Checked in successfully",
  "at": "iso" }

// screen.heartbeat (admin observers)
{ "screen_id": "01J…", "playback_status": "playing", "current_item_id": "…",
  "received_at": "iso", "ip_address": "10.12.4.21" }
```

When `signage_check_ins` rows are inserted by the attendance subsystem, fire `checkin.new` on the matching branch channel (use a model observer or domain event).

---

## 8. Validation rules (Form Requests)

```php
// CreateLoopRequest
[
  'branch_id'    => ['nullable','ulid','exists:signage_branches,id'],
  'name'         => ['required','string','max:160'],
  'description'  => ['nullable','string','max:2000'],
  'is_active'    => ['boolean'],
  'auto_replay'  => ['boolean'],
  'emergency_override_enabled' => ['boolean'],
]

// CreateLoopItemRequest
[
  'content_type'        => ['required', Rule::in(CONTENT_TYPES)],
  'media_id'            => ['nullable','ulid','exists:signage_media,id'],
  'title'               => ['nullable','string','max:200'],
  'duration_seconds'    => ['required','integer','min:2','max:600'],
  'transition_type'     => ['nullable', Rule::in(TRANSITIONS)],
  'background_audio_enabled' => ['boolean'],
  'overlay_enabled'     => ['boolean'],
  'payload'             => ['nullable','array'],
  'schedule_constraints'=> ['nullable','array'],
]

// CreateScreenRequest
[
  'branch_id'        => ['required','ulid','exists:signage_branches,id'],
  'name'             => ['required','string','max:120'],
  'screen_code'      => ['nullable','string','max:32','unique:signage_screens,screen_code','regex:/^[A-Z0-9-]+$/'],
  'resolution'       => ['nullable','regex:/^\\d{3,4}x\\d{3,4}$/'],
  'orientation'      => ['nullable', Rule::in(ORIENTATIONS)],
  'timezone'         => ['nullable','timezone'],
  'assigned_loop_id' => ['nullable','ulid','exists:signage_loops,id'],
]

// CreateScheduleRequest
[
  'name'        => ['required','string','max:160'],
  'loop_id'     => ['required','ulid','exists:signage_loops,id'],
  'screen_ids'  => ['required','array','min:1'],
  'screen_ids.*'=> ['ulid','exists:signage_screens,id'],
  'days'        => ['required','array','min:1'],
  'days.*'      => [Rule::in(WEEKDAYS)],
  'start_time'  => ['required','date_format:H:i'],
  'end_time'    => ['required','date_format:H:i','after:start_time'],
  'start_date'  => ['required','date'],
  'end_date'    => ['nullable','date','after_or_equal:start_date'],
  'priority'    => ['integer','min:0','max:100'],
]

// CreateAlertRequest
[
  'title'         => ['required','string','max:200'],
  'message'       => ['nullable','string','max:2000'],
  'severity'      => ['required', Rule::in(SEVERITIES)],
  'audio_enabled' => ['boolean'],
  'ticker_text'   => ['nullable','string','max:500'],
  'start_time'    => ['required','date'],
  'end_time'      => ['required','date','after:start_time'],
  'branch_ids'    => ['array'], 'branch_ids.*' => ['ulid','exists:signage_branches,id'],
  'screen_ids'    => ['array'], 'screen_ids.*' => ['ulid','exists:signage_screens,id'],
  'is_active'     => ['boolean'],
]
```

---

## 9. File uploads & media pipeline

1. `POST /media` (multipart).
2. Stream upload to S3-compatible storage (`storage_disk = 's3'`).
3. Dispatch `ProcessUploadedMedia` job that:
   - For images: generate 320px thumbnail, store at `storage_path + '_thumb.jpg'`, fill `thumbnail_url`, `width`, `height`.
   - For videos: ffprobe → `duration_ms`, `width`, `height`. Generate poster frame thumbnail.
   - For lottie: parse JSON, store dimensions.
4. Once processed, broadcast `media.processed` on the admin channel so the React UI swaps the placeholder thumbnail.

Limits: 200 MB per file by default. Reject unknown mime types up-front.

---

## 10. Eloquent model sketch

```php
// app/Models/Signage/Loop.php
class Loop extends Model {
    use HasUlids, SoftDeletes;
    protected $table = 'signage_loops';
    protected $fillable = ['branch_id','name','description','is_active','auto_replay','emergency_override_enabled','created_by_user_id'];
    protected $casts = ['is_active'=>'bool','auto_replay'=>'bool','emergency_override_enabled'=>'bool'];

    public function branch()  { return $this->belongsTo(Branch::class); }
    public function items()   { return $this->hasMany(LoopItem::class)->orderBy('position'); }
    public function screens() { return $this->hasMany(Screen::class, 'assigned_loop_id'); }
    public function schedules(){ return $this->hasMany(Schedule::class); }
}

// app/Models/Signage/LoopItem.php
class LoopItem extends Model {
    use HasUlids;
    protected $table = 'signage_loop_items';
    protected $casts = ['payload'=>'array','schedule_constraints'=>'array',
                        'background_audio_enabled'=>'bool','overlay_enabled'=>'bool'];
    public function loop()  { return $this->belongsTo(Loop::class); }
    public function media() { return $this->belongsTo(Media::class); }
}
```

Repeat the same pattern for `Screen`, `Branch`, `Schedule`, `Alert`, `Media`.

---

## 11. Error format

```json
{
  "error": {
    "code":    "VALIDATION_FAILED",
    "message": "The given data is invalid.",
    "details": {
      "name": ["The name field is required."],
      "duration_seconds": ["Must be between 2 and 600."]
    }
  }
}
```

Standard codes: `VALIDATION_FAILED` (422), `NOT_FOUND` (404), `FORBIDDEN` (403), `UNAUTHENTICATED` (401), `CONFLICT` (409), `RATE_LIMITED` (429), `SERVER_ERROR` (500), `PAIRING_EXPIRED` (410).

---

## 12. Suggested Laravel structure

```
app/
├── Domain/Signage/                     # Domain logic, no Eloquent leaks
│   ├── Resolver/LoopResolver.php       # picks effective loop for a screen at time T
│   ├── Hydrator/                       # one hydrator per CENTER content type
│   │   ├── AttendanceHydrator.php
│   │   ├── LiveClassesHydrator.php
│   │   ├── FacultyScheduleHydrator.php
│   │   ├── AiHighlightsHydrator.php
│   │   └── ContentHydratorRegistry.php
│   ├── Player/PlayerPayloadBuilder.php
│   └── Events/                         # ScreenWentOnline, AlertBroadcast, …
├── Http/
│   ├── Controllers/Signage/Admin/      # one controller per resource
│   ├── Controllers/Signage/Player/
│   ├── Requests/Signage/
│   ├── Resources/Signage/              # JSON transformers
│   └── Middleware/PlayerScreenAuth.php
├── Models/Signage/                     # Branch, Screen, Loop, LoopItem, Schedule, Alert, Media
├── Policies/Signage/                   # one policy per model, branch-scoped checks
├── Jobs/Signage/
│   ├── ProcessUploadedMedia.php
│   └── PurgeStaleHeartbeats.php
├── Broadcasting/Signage/               # channel auth + event classes
└── Console/Commands/Signage/
    ├── MarkOfflineScreens.php          # every 1 min: screens with no heartbeat in 3 min → offline
    └── CleanupExpiredAlerts.php        # every 5 min: end_time < now → is_active=false
```

Scheduler (`app/Console/Kernel.php`):

```php
$schedule->command('signage:mark-offline-screens')->everyMinute();
$schedule->command('signage:cleanup-expired-alerts')->everyFiveMinutes();
$schedule->command('signage:purge-stale-heartbeats')->daily();
```

---

## 13. Implementation order (recommended)

1. Migrations + Eloquent models + factories + seeders (mirror `digitalSignageStore.js` seed for parity).
2. RBAC permissions + Policies.
3. Branch / Screen / Loop / LoopItem CRUD + Form Requests + Resources.
4. Schedule CRUD + `LoopResolver`.
5. Media upload + thumbnail job.
6. Player API: pair, fetch, heartbeat — using `PlayerPayloadBuilder` + GLOBAL hydration only.
7. Hydrators for CENTER types (one PR per content type).
8. Alerts CRUD + broadcast + WebSocket channels.
9. Scheduler commands (offline detection, alert expiry).
10. Realtime: check-in event observer on attendance table → `checkin.new`.

Once steps 1–6 land, the existing React admin and React player will both function end-to-end against the new backend with **no front-end changes** (assuming `VITE_API_BASE` is set and `VITE_USE_MOCK=false`).

---

## 14. Things deliberately out of scope here

- **CDN signing / private media URLs** — assume your existing media-hosting layer (Bunny.net per `bunny-proxy-server.js`) handles this. Just store `cdn_url` and let Bunny serve.
- **Player auto-update** — the player checks `config_version` on every poll; if the front-end bundle itself needs to change, that's a separate kiosk-update channel (out of scope).
- **Audit log** — recommend a `signage_audit_log` table (`actor_id, action, entity_type, entity_id, before, after, created_at`) wired through a Laravel observer, but defer until needed.
- **Multi-loop chaining / playlist nesting** — not modelled; ask before adding.
