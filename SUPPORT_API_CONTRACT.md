# Support Inbox — List Chat Threads API Contract

Source of truth for the UI: [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx)

This contract is written so Claude Code can implement the backend endpoint and wire the React page to it without further clarification. Follows the project's existing API conventions in [src/lib/api.js](src/lib/api.js) and the style used in [LEADS_API_CONTRACT.md](LEADS_API_CONTRACT.md).

---

## 1. Conventions

- **Base URL:** taken from `BASE_URL` in [src/lib/api.js](src/lib/api.js)
  - Local: `http://127.0.0.1:3004/api`
  - Prod:  `https://crisprtech.app/api`
- **Auth header:** `X-Access-Token: <token>` on every request (handled by the axios interceptor).
- **Resource root:** `/support/threads`
- **Content-Type:** `application/json` for all request bodies.
- **Timestamps:** ISO-8601 UTC strings (`2026-05-23T14:30:00Z`).
- **IDs:** server-generated; keep consistent with the rest of the system (integer or string).

### Standard response envelope

List endpoint:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "size": 10, "total": 42, "totalPages": 5, "unreadCount": 7 }
}
```

Errors:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid assignee filter" } }
```
HTTP status: `400` validation, `401` auth, `403` forbidden, `500` server error.

---

## 2. Domain model

### ChatThread (list item)

The UI list row in [src/pages/SupportPage.jsx:225-249](src/pages/SupportPage.jsx) consumes exactly the fields below. Do **not** return the full `messages[]` array on the list endpoint — only a `lastMessage` preview.

| Field           | Type                                          | Notes |
|-----------------|-----------------------------------------------|-------|
| `id`            | integer / string                              | thread id |
| `type`          | enum: `app_ticket` \| `whatsapp_lead`         | drives the badge in the list (`App Ticket` vs `WhatsApp`) |
| `studentName`   | string                                        | display name; for WhatsApp leads include phone, e.g. `"Jane Smith (+91 9876543210)"` |
| `studentId`     | integer / string \| null                      | nullable — set for `app_ticket`, may be null for `whatsapp_lead` (used by profile modal) |
| `assignee`      | string                                        | one of: `"Unassigned"`, `"Alice"`, `"Bob"`, `"Charlie"` (current hardcoded values in [src/pages/SupportPage.jsx:3](src/pages/SupportPage.jsx); replace with dynamic list when assignees become a managed resource) |
| `tag`           | string                                        | one of: `None`, `Escalation`, `Feedback`, `Purchase`, `Complaint`, `Legal`, `Other`, `Technical Issue` |
| `status`        | enum: `In Progress` \| `Closed` \| `Re-opened`| |
| `unread`        | boolean                                       | true if the last inbound (user) message hasn't been seen by the current agent |
| `lastUpdate`    | ISO-8601 timestamp                            | timestamp of the most recent message in the thread; used for sorting |
| `lastMessage`   | object                                        | preview only — see below |
| `createdAt`     | ISO-8601 timestamp                            | used to compute "Age: N days" in the thread header |
| `messageCount`  | integer                                       | total messages in thread (optional, useful for badges) |

### ChatThread.lastMessage

| Field       | Type                          | Notes |
|-------------|-------------------------------|-------|
| `id`        | string                        | message id |
| `sender`    | enum: `user` \| `agent`       | drives the `You: ` prefix in the list row |
| `text`      | string                        | trimmed/truncated to ~200 chars server-side is fine |
| `timestamp` | ISO-8601 timestamp            | |

---

## 3. Endpoint

### `GET /support/threads`

List chat threads for the Support Inbox. Server-side filtering, sorting, and pagination.

#### Query parameters

| Param         | Type     | Default       | Notes |
|---------------|----------|---------------|-------|
| `page`        | integer  | `1`           | 1-based page index |
| `size`        | integer  | `10`          | matches `itemsPerPage` in [src/pages/SupportPage.jsx:89](src/pages/SupportPage.jsx); max `100` |
| `search`      | string   | —             | case-insensitive; matches `studentName` OR any message text in the thread. Mirrors the search in [src/pages/SupportPage.jsx:103-107](src/pages/SupportPage.jsx) |
| `assignee`    | string   | —             | exact match; omit param for "All Assignees" |
| `pendingOnly` | boolean  | `false`       | when `true`, return only threads where the **last message is from `user`** AND `status != Closed` (see [src/pages/SupportPage.jsx:109-114](src/pages/SupportPage.jsx)) |
| `status`      | string   | —             | optional; one of the status enum values. Not used by the current UI but useful for future filters |
| `type`        | string   | —             | optional; `app_ticket` or `whatsapp_lead` |
| `sort`        | string   | `-lastUpdate` | default = most-recent-update first. Support `lastUpdate`, `-lastUpdate`, `createdAt`, `-createdAt` |

#### Example request

```
GET /support/threads?page=1&size=10&search=test&assignee=Alice&pendingOnly=true
X-Access-Token: <token>
```

#### Example response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "app_ticket",
      "studentName": "John Doe",
      "studentId": 5042,
      "assignee": "Alice",
      "tag": "Technical Issue",
      "status": "In Progress",
      "unread": true,
      "lastUpdate": "2026-05-23T09:25:00Z",
      "createdAt": "2026-05-21T09:30:00Z",
      "messageCount": 3,
      "lastMessage": {
        "id": "m3",
        "sender": "user",
        "text": "It still shows \"No active packages\".",
        "timestamp": "2026-05-23T09:25:00Z"
      }
    },
    {
      "id": 2,
      "type": "whatsapp_lead",
      "studentName": "Jane Smith (+91 9876543210)",
      "studentId": null,
      "assignee": "Unassigned",
      "tag": "Purchase",
      "status": "In Progress",
      "unread": true,
      "lastUpdate": "2026-05-23T09:15:00Z",
      "createdAt": "2026-05-23T09:15:00Z",
      "messageCount": 1,
      "lastMessage": {
        "id": "m4",
        "sender": "user",
        "text": "I asked the bot about crash course but want more details.",
        "timestamp": "2026-05-23T09:15:00Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "size": 10,
    "total": 25,
    "totalPages": 3,
    "unreadCount": 7
  }
}
```

`meta.unreadCount` is the total number of unread threads across **all** pages matching the current filter — useful for showing an inbox badge.

---

## 4. UI wiring notes

When integrating into [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx):

1. Create `src/lib/supportApi.js` exporting `listSupportThreads({ page, size, search, assignee, pendingOnly })` — mirror the shape of [src/lib/leadsApi.js](src/lib/leadsApi.js).
2. Replace the in-file `initialMessages` mock and the client-side `filteredChats` `useMemo` ([src/pages/SupportPage.jsx:103-118](src/pages/SupportPage.jsx)) with a `useEffect` that re-fetches whenever `searchQuery`, `assigneeFilter`, `showPendingOnly`, or `currentPage` change. Debounce `searchQuery` ~300 ms.
3. Drive `totalPages` from `meta.totalPages` instead of computing it locally.
4. Keep `selectedChatId` separate — selecting a thread should fetch its full message history from a **separate** endpoint (out of scope here; suggested: `GET /support/threads/:id`).
5. The "mark as read" side-effect in `handleSelectChat` ([src/pages/SupportPage.jsx:130-132](src/pages/SupportPage.jsx)) should be backed by a `POST /support/threads/:id/read` (also out of scope here) — until that exists, keep the optimistic local update.

---

## 5. Out of scope (future endpoints)

The following are referenced by the current UI but **not** part of this contract:

- `GET /support/threads/:id` — full thread incl. `messages[]`
- `POST /support/threads/:id/messages` — agent reply (used by `handleSendMessage`, [src/pages/SupportPage.jsx:146](src/pages/SupportPage.jsx))
- `PATCH /support/threads/:id` — update `assignee` / `tag` / `status` (used by `handleChatMetaChange`, [src/pages/SupportPage.jsx:169](src/pages/SupportPage.jsx))
- `POST /support/threads/:id/read` — mark thread read
- `GET /support/assignees` — replace the hardcoded `ASSIGNEES` array
- `GET /support/templates` — replace the hardcoded `TEMPLATES` array
