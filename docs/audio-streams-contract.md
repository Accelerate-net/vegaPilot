# Contract — `audio_streams` Module (Mentor Sessions / Audio Rooms)

**Base path:** `{{base_url}}/restricted/audio-streams`
**Status:** Draft / proposed
**Owner (FE):** Mentor Sessions page (`/mentor-sessions`)
**Provider:** [getstream.io](https://getstream.io) — **Video & Audio** product, `audio_room` call type
**Backwards compatible:** New module; no existing endpoints affected.

---

## 1. Purpose

`audio_streams` schedules and tracks **Audio Rooms** in which a mentor (host),
optional co-host mentors, and a batch-scoped audience of student mentees talk
live. Rooms are backed by getstream.io `audio_room` calls: host + co-hosts are
speakers, the audience joins as listeners, and — when **Request to Join** is
enabled — listeners raise a hand and the host admits them to the stage.

The admin portal only **schedules and tracks** rooms. The actual audio session
runs in the student/mentor mobile/web clients via the Stream SDK. This module
owns: persistence of the schedule, provisioning the Stream call, minting Stream
tokens, enforcing audience membership, and recording engagement stats.

The FE client for this contract is [`src/lib/mentorSessionsApi.js`](../src/lib/mentorSessionsApi.js).
It mirrors the conventions already used by the Live Class Scheduler
(`src/lib/liveClassApi.js`).

---

## 2. Conventions

- **Auth:** `X-Access-Token` header (same as every `/restricted/*` route).
- **Permissions** (must be added to `App\Enums\Permission`, matching `src/lib/permissions.js`):
  | Key | Gate |
  |---|---|
  | `mentorSessions.view` | list / get / participants |
  | `mentorSessions.edit` | create / update |
  | `mentorSessions.host` | go-live / end / mint host token |
  | `mentorSessions.delete` | cancel (high-risk) |
- **Envelopes:**
  - Single: `{ "status": "success", "data": { … } }`
  - List: `{ "status": "success", "data": [ … ], "meta": { page, per_page, total, totalPages } }`
  - Error: `{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": { "fields": { … } } } }`
- **Stream errors:** any failure originating from the getstream provisioning /
  lifecycle layer MUST use a code prefixed `STREAM_` (e.g. `STREAM_PROVISION_FAILED`,
  `STREAM_TOKEN_FAILED`). The FE keys off this prefix (`isStreamError`) to show a
  retry affordance rather than a generic error.

---

## 3. Resource shape — `AudioStream`

```jsonc
{
  "id": "as_01H...",
  "title": "IAT 2026 — Doubt Clearing Audio Room",
  "brief": "Open-mic doubt clearing for Physics & Chemistry.",   // nullable

  "host":   { "id": "m1", "name": "Rajesh Kumar", "photo": null },
  "cohosts": [ { "id": "m2", "name": "Priya Sharma", "photo": null } ],
  "audience_batches": [ { "id": "b1", "name": "IAT 2026 Morning" } ],

  "mode": "audio_room",                 // reserved; always "audio_room" for now
  "is_instant": false,
  "scheduled_at": "2026-06-20T15:30:00.000Z",   // null when is_instant=true and not yet started
  "duration_label": "1h",
  "duration_minutes": 60,
  "request_to_join": true,              // listeners must be admitted to speak

  "status": "scheduled",               // scheduled | live | ended | cancelled

  "stream": {
    "call_type": "audio_room",
    "call_id": "audio_room:as_01H...",  // null until provisioned
    "call_cid": "audio_room:as_01H...", // Stream's <type>:<id>
    "provisioned_at": "2026-06-20T15:28:00.000Z",  // null until provisioned
    "join_url": "https://crisprtech.app/room/as_01H...",  // deep link for clients
    "recording_url": null               // populated after the room ends, if recorded
  },

  "stats": {
    "invited_count": 84,    // sum of student counts across audience batches
    "joined_count": 0,      // distinct listeners who have joined
    "peak_listeners": 0,
    "speaker_count": 0      // host + co-hosts + admitted listeners
  },

  "started_at": null,
  "ended_at": null,
  "created_at": "2026-06-15T09:00:00.000Z"
}
```

`host` / `cohosts` reference the existing mentor resource
(`/restricted/people/mentor/list`). `audience_batches` reference batches
(`/restricted/enrollment/list-batches`).

---

## 4. Endpoints

### 4.1 List — `GET /restricted/audio-streams`
Query: `search`, `status`, `host_id`, `page` (1), `per_page` (25), `sort` (`-scheduled_at`).
→ `{ data: AudioStream[], meta }`. Live rooms should sort first regardless of `sort`.

### 4.2 Get — `GET /restricted/audio-streams/{id}` → `{ data: AudioStream }`

### 4.3 Create — `POST /restricted/audio-streams`
```jsonc
{
  "title": "string (required)",
  "brief": "string|null",
  "host_id": "m1 (required)",
  "cohost_ids": ["m2"],
  "mode": "audio_room",
  "is_instant": false,
  "scheduled_at": "2026-06-20T15:30:00.000Z",  // required unless is_instant
  "duration_label": "1h",
  "duration_minutes": 60,
  "request_to_join": true,
  "audience_batch_ids": ["b1", "b2"]           // required, ≥ 1
}
```
Behaviour:
- Validate `host_id` is a mentor and `audience_batch_ids` resolve to real batches.
- Create the row with `status="scheduled"`.
- **Provision the Stream call now** (see §5). On provisioning failure return
  `STREAM_PROVISION_FAILED` with the row NOT persisted (or persisted unprovisioned
  — either is acceptable as long as the FE can retry). Recommended: persist, then
  the FE retries via go-live.
- If `is_instant=true`, immediately run the go-live transition (status → `live`)
  and return the live resource.
→ `201 { data: AudioStream }`

### 4.4 Update — `PATCH /restricted/audio-streams/{id}`
Partial. Only `scheduled` rooms may change `scheduled_at`, `duration_*`,
`request_to_join`, `cohost_ids`, `audience_batch_ids`, `title`, `brief`.
→ `{ data: AudioStream }`

### 4.5 Cancel — `DELETE /restricted/audio-streams/{id}`
Allowed from `scheduled` (and `live` if you choose to force-close). Sets
`status="cancelled"`, ends the Stream call if one is live. → `204`

### 4.6 Go live — `POST /restricted/audio-streams/{id}/go-live`
Idempotent. Ensures the Stream call exists (provision if needed), calls
`call.goLive()` server-side, sets `status="live"`, `started_at=now`.
→ `{ data: AudioStream }` · errors: `STREAM_PROVISION_FAILED`, `STREAM_GOLIVE_FAILED`.

### 4.7 End — `POST /restricted/audio-streams/{id}/end`
Calls `call.end()` server-side, sets `status="ended"`, `ended_at=now`, finalizes
`stats`, and attaches `stream.recording_url` if recording was on.
→ `{ data: AudioStream }`

### 4.8 Mint Stream token — `POST /restricted/audio-streams/{id}/token`
For the admin to preview/host from the browser. Returns a short-lived user token
scoped to this call.
```jsonc
{ "data": {
  "api_key": "stream_app_key",
  "token": "jwt...",
  "call_type": "audio_room",
  "call_id": "as_01H...",
  "user_id": "admin_<id>",
  "role": "host"            // host | listener
} }
```
errors: `STREAM_TOKEN_FAILED`.

### 4.9 Participants — `GET /restricted/audio-streams/{id}/participants`
```jsonc
{ "data": {
  "invited": 84, "joined": 21, "peak_listeners": 24,
  "speakers": [ { "id": "m1", "name": "Rajesh Kumar", "role": "host" } ],
  "requests": [ { "id": "s9", "name": "Asha R", "requested_at": "..." } ],  // pending hands
  "listeners_sample": [ { "id": "s1", "name": "..." } ]
} }
```

---

## 5. getstream.io integration (server-side)

Use the **Stream server SDK** (e.g. `GetStream\StreamChat` / the Video REST API)
with the app's secret — never expose the API secret to clients.

**On create / go-live — provision the call:**
```
call = streamVideo.video.call("audio_room", <audioStream.id>)
call.getOrCreate({
  data: {
    created_by_id: <host stream user id>,
    members: [ {user_id: host, role: "host"},
               ...cohosts.map(c => ({user_id: c, role: "host"})) ],
    settings_override: {
      audio:  { mic_default_on: true, default_device: "speaker" },
      // Request-to-join → listeners join muted, can send a "permission request"
      // to speak which the host grants. Map request_to_join → backstage/roles.
      backstage: { enabled: <request_to_join> }
    },
    custom: { title, brief, audience_batch_ids }
  }
})
```

**Audience enforcement:** when a client requests a token (§4.8) or join, verify
the user is enrolled in one of `audience_batch_ids` (or is host/co-host). Issue
`role: "host"` for host/co-hosts, `role: "listener"` (call-type role with no
`send-audio` capability) for the audience. With `request_to_join`, listeners must
be granted speaking permission by the host before they can publish audio.

**Lifecycle:** `go-live` → `call.goLive()`; `end` → `call.end()`. Optionally
enable recording via call settings; on `call.recording_ready` webhook, persist
the asset URL into `stream.recording_url`.

**Webhooks (recommended for live `stats`):** subscribe to
`call.session_participant_joined/left`, `call.permission_request`, and
`call.recording_ready`. Update `stats` (`joined_count`, `peak_listeners`,
`speaker_count`) and `participants.requests` from these events.

**Env / config:**
```
STREAM_API_KEY=...
STREAM_API_SECRET=...
STREAM_APP_ID=...
```

---

## 5b. Room client handoff (`meeting-room-app`)

Mentors run the live session from the standalone **Audio Room** web app
(`meeting-room-app/`, deployed at `room.crisprlearning.com`). The admin portal's
Mentor Sessions page opens it with:

```
https://room.crisprlearning.com/?id=<audio_stream_id>&t=<access_token>
```

The room app then calls §4.1/§4.8 (`GET {id}` + `POST {id}/token`) with
`X-Access-Token: <t>` to fetch the session and mint getstream credentials, and
drives the call client-side (join, go-live, mic, grant/revoke speak permission).

**BE action:** `POST {id}/token` (§4.8) must accept the portal access token and
return `role` based on whether that user is the host, a co-host, or neither
(→ `listener`). Token must be short-lived and scoped to this `call_id`.

**Security recommendation:** instead of forwarding the long-lived admin token in
the URL, add an endpoint that mints a **single-room ticket** at Join time
(e.g. `POST {id}/join-ticket → { ticket }`), and let the room app pass `?t=<ticket>`.
The room app treats `t` as opaque, so this is a BE-only change when you're ready.

## 6. State machine

```
scheduled ──go-live──▶ live ──end──▶ ended
    │                    │
    └──────cancel────────┴──cancel──▶ cancelled
```
`is_instant` create = `scheduled` → `go-live` collapsed into one step.

---

## 7. Open questions for BE

1. Mentor identity ↔ Stream user id mapping — reuse `mentor.id`, or a dedicated
   `stream_user_id`? FE sends `host_id`/`cohost_ids` as mentor ids.
2. Should `invited_count` be computed at create time (snapshot of batch sizes) or
   live at read time? FE just renders the number.
3. Recording: on by default, opt-in per room, or never? (No FE toggle yet — easy
   to add a `record` boolean to §4.3 if needed.)
4. Reschedule of a provisioned call — reuse the same `call_id` or re-provision?
