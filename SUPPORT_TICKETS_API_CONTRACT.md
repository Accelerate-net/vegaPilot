# Support Tickets — API Contract

Source of truth for the UI: [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx)
Companion to: [SUPPORT_API_CONTRACT.md](SUPPORT_API_CONTRACT.md) (thread listing)

Extends the Support Inbox with a **Support Ticket** resource that can be attached to a chat thread. A thread may have **zero or more** tickets over its lifetime; the **most-recently-created** ticket is the "active" ticket shown at the top of the right-side panel. Older tickets are surfaced via a "Previous Tickets" popup.

---

## 1. Conventions

Same as [SUPPORT_API_CONTRACT.md §1](SUPPORT_API_CONTRACT.md):
- Base URL from `BASE_URL` in [src/lib/api.js](src/lib/api.js)
- `X-Access-Token: <token>` header
- ISO-8601 UTC timestamps
- Standard envelope (`{ success, data, meta? }` / `{ success, error }`)
- HTTP: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `500` server.

Resource root: `/support/tickets` (and nested forms under `/support/threads/:threadId/tickets`).

---

## 2. UI ↔ workflow mapping

Where each piece of data lives in [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx) once tickets exist:

| UI element                                                       | Source                  | Before                                | After (with tickets)                                       |
|------------------------------------------------------------------|-------------------------|---------------------------------------|------------------------------------------------------------|
| Left list row badges (`App Ticket` / `WhatsApp`, assignee chip)  | `ChatThread`            | `chat.assignee`, `chat.type`          | `chat.type` unchanged; assignee chip = `activeTicket.assignee` (or "Unassigned" if no active ticket) |
| Thread header — Source / Thread ID / **conversation** Age        | `ChatThread`            | `chat.type`, `chat.id`, age from first message | unchanged |
| Thread header — status badge next to student name                | `ChatThread.status`     | derived from thread                   | **derived from `activeTicket.status`**; if no ticket: show `"No ticket"` neutral chip |
| Right panel **Active Ticket card** (new, sits above messages)    | `activeTicket`          | n/a                                   | shows `ticketCode`, `assignee`, `tag`, `status`, `ageDays` (from `ticket.createdAt`), `Previous Tickets (N)` button, `Raise New Ticket` button |
| Assignee / Tag / Status dropdowns (currently on thread header, [src/pages/SupportPage.jsx:315-334](src/pages/SupportPage.jsx)) | `activeTicket` | edited thread meta            | **moved into the Active Ticket card**; edits go to `PATCH /support/tickets/:id` |
| "Previous Tickets" popup                                         | `GET /threads/:id/tickets` | n/a                                | modal listing all tickets on the thread, newest first; click row → drill-in modal |
| Reply textarea / Send                                            | `ChatMessage`           | posts to thread                       | unchanged — replies still post to the **thread**, not the ticket. If an active ticket exists, the server stamps the message with `ticketId` for traceability. |
| "Create Ticket" / "View Active Ticket" FAB                       | new                     | n/a                                   | Floating button at bottom-right of the right panel. When **no open ticket** exists → red **Create Ticket** FAB opens the create modal (`POST /support/threads/:id/tickets`). When an **open ticket** exists (`status ∈ {DRAFT, IN_PROGRESS}`) → amber **View Active Ticket** FAB opens the View modal. See [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx). |
| View Active Ticket modal — Notes timeline                        | `TicketNote[]`          | n/a                                   | Chronological list (oldest → newest) inside the View modal, with an inline composer. `GET /support/tickets/:id/notes` to load; `POST` to append. Notes are **internal** — never posted to the customer-facing thread. |
| Sending a "Closing Reply"                                        | `ChatMessage` + ticket  | n/a                                   | A normal chat reply with `kind: "closure"` is sent to the thread AND auto-transitions the active ticket to `CLOSED`. See §5. |

### Visual order in the right panel (top to bottom)
1. Thread header (student, conversation meta) — unchanged
2. **Active Ticket card** — new (replaces the assignee/tag/status row currently at [src/pages/SupportPage.jsx:315-334](src/pages/SupportPage.jsx))
3. Messages
4. Reply box (with a new "Send as closing reply" checkbox)

---

## 3. Domain model

### SupportTicket

| Field           | Type                                              | Notes |
|-----------------|---------------------------------------------------|-------|
| `id`            | integer / string                                  | server-generated |
| `ticketCode`    | string                                            | human-friendly code, e.g. `TKT-2026-00142`; displayed in UI |
| `threadId`      | integer / string                                  | FK → ChatThread; required |
| `studentId`     | integer / string \| null                          | denormalized from thread for indexing |
| `title`         | string                                            | short summary; required on create; defaults server-side to last user message snippet if omitted |
| `description`   | string \| null                                    | optional longer note captured at raise-time |
| `assigneeId`    | integer / string \| null                          | id of the Support Associate; null = `Unassigned` |
| `assigneeName`  | string                                            | denormalized display name (server-resolved) |
| `tag`           | enum                                              | `None` \| `Escalation` \| `Feedback` \| `Purchase` \| `Complaint` \| `Legal` \| `Technical Issue` \| `Other` (matches `TAGS` in [src/pages/SupportPage.jsx:4](src/pages/SupportPage.jsx)) |
| `status`        | enum: `DRAFT` \| `IN_PROGRESS` \| `CLOSED`      | uppercase on the wire; UI maps to title case |
| `createdAt`     | ISO-8601 timestamp                                | drives the **ticket** Age in the card |
| `updatedAt`     | ISO-8601 timestamp                                | |
| `closedAt`    | ISO-8601 timestamp \| null                        | set when status transitions to `CLOSED` |
| `closedBy`    | object \| null                                    | `{ id, name }` of the associate who closed it |
| `closingMessageId` | string \| null                              | id of the chat message that carried the closing reply to the customer (see §5) |
| `createdBy`     | object                                            | `{ id, name }` |
| `noteCount`     | integer                                           | total notes attached to the ticket; convenience field for list views |
| `notes`         | `TicketNote[]` \| omitted                         | embedded **only** on `GET /support/tickets/:id`. List endpoints omit this — fetch via §4.7. |

### TicketNote

Internal, chronological log entries attached to a ticket. **Not visible to the customer** — distinct from chat messages on the thread.

| Field        | Type                | Notes |
|--------------|---------------------|-------|
| `id`         | integer / string    | server-generated |
| `ticketId`   | integer / string    | FK → SupportTicket |
| `text`       | string              | required; the note body |
| `author`     | object              | `{ id, name }` of the Support Associate who wrote it |
| `createdAt`  | ISO-8601 timestamp  | used for chronological ordering (oldest first in the UI) |
| `editedAt`   | ISO-8601 timestamp \| null | set if the note has been edited (out of scope for v1) |

### SupportAssociate (referenced)

| Field   | Type    | Notes |
|---------|---------|-------|
| `id`    | integer / string | |
| `name`  | string  | display name |
| `email` | string  | optional |
| `active`| boolean | only active associates are assignable |

Replaces the hardcoded `ASSIGNEES` array at [src/pages/SupportPage.jsx:3](src/pages/SupportPage.jsx).

### ChatThread — additions (companion to [SUPPORT_API_CONTRACT.md §2](SUPPORT_API_CONTRACT.md))

Add the following fields to the `ChatThread` returned by `GET /support/threads` and `GET /support/threads/:id`:

| Field             | Type                | Notes |
|-------------------|---------------------|-------|
| `activeTicket`    | `SupportTicket` \| null | the most-recently-created ticket; `null` if no ticket has been raised on this thread |
| `ticketCount`     | integer             | total tickets ever raised on this thread; drives the `Previous Tickets (N)` button visibility (show when `> 1`) |

The legacy thread-level `assignee` / `tag` / `status` fields on `ChatThread` become **derived** from `activeTicket` and should be treated as read-only / removed in a future cleanup.

### ChatMessage — additions

| Field         | Type                                    | Notes |
|---------------|-----------------------------------------|-------|
| `ticketId`    | integer / string \| null                | server-stamped when the active ticket exists at send time |
| `kind`        | enum: `reply` \| `closure` \| `system` | `closure` → side-effect described in §5; `system` → server-emitted entries like "Ticket TKT-2026-00142 created by Alice" |

---

## 4. Endpoints

### 4.1 `POST /support/threads/:threadId/tickets`
Raise a new ticket on a thread. The new ticket becomes the `activeTicket`.

**Request**
```json
{
  "title": "Test series not loading",
  "description": "User reports 'No active packages' after session reset.",
  "assigneeId": 12,
  "tag": "Technical Issue",
  "status": "IN_PROGRESS"
}
```
- `title` required; all other fields optional.
- `status` defaults to `IN_PROGRESS`. Allowed initial values: `DRAFT`, `IN_PROGRESS`.
- `409` if the thread already has an active ticket in `IN_PROGRESS` or `DRAFT` (configurable; recommend allowing only one open ticket per thread at a time — see §6).

**Response:** `201 Created` with `{ success: true, data: SupportTicket }`.

Side-effects:
- Emits a `system` chat message on the thread: `"Ticket {ticketCode} raised by {assigneeName}"`. The UI will render it inline in the messages list.

---

### 4.2 `GET /support/threads/:threadId/tickets`
List all tickets attached to a thread, newest first. Powers the **Previous Tickets** popup.

**Query params**
| Param   | Type    | Default | Notes |
|---------|---------|---------|-------|
| `page`  | integer | `1`     | |
| `size`  | integer | `20`    | |
| `status`| string  | —       | optional filter |

**Response**
```json
{
  "success": true,
  "data": [ SupportTicket, ... ],
  "meta": { "page": 1, "size": 20, "total": 3, "totalPages": 1 }
}
```

---

### 4.3 `GET /support/tickets/:id`
Fetch a single ticket (used by the drill-in inside the Previous Tickets popup).
**Response:** `{ success: true, data: SupportTicket }`.

---

### 4.4 `PATCH /support/tickets/:id`
Edit the active ticket from the right-panel card. Replaces the current `handleChatMetaChange` at [src/pages/SupportPage.jsx:169](src/pages/SupportPage.jsx).

**Request** (any subset)
```json
{
  "assigneeId": 14,
  "tag": "Escalation",
  "status": "IN_PROGRESS",
  "title": "…",
  "description": "…"
}
```

**Status transitions** (server-enforced):
- `DRAFT → IN_PROGRESS` ✅
- `DRAFT → CLOSED` ✅
- `IN_PROGRESS → CLOSED` ✅
- `CLOSED → IN_PROGRESS` ✅ (re-open)
- `IN_PROGRESS → DRAFT` ❌ → `409`
- `CLOSED → DRAFT` ❌ → `409`

Setting `status = CLOSED` here (without a customer-facing message) is allowed for internal closures, but the **preferred** path is §5 ("Send as closing reply"), which both notifies the customer and closes the ticket atomically.

**Response:** `{ success: true, data: SupportTicket }`.

Side-effects:
- On status changes and assignee changes, emit a `system` message on the thread, e.g. `"Status changed to Closed by Alice"`.

---

### 4.5 `POST /support/threads/:threadId/messages` (extension)
Already implied by [SUPPORT_API_CONTRACT.md §5](SUPPORT_API_CONTRACT.md). Extend the request body to support closing the active ticket atomically:

**Request**
```json
{
  "text": "I have reset your session — please re-open the app.",
  "kind": "reply",
  "asClosure": false
}
```
- `kind` defaults to `reply`.
- When `asClosure: true`:
  - server requires an `activeTicket` to exist on the thread, else `409 NO_ACTIVE_TICKET`.
  - server creates the chat message with `kind: "closure"` and `ticketId = activeTicket.id`.
  - server transitions the active ticket to `CLOSED`, sets `closedAt = now`, `closedBy = currentUser`, `closingMessageId = <messageId>`.
  - both effects happen in a single transaction; response returns the new message AND the updated ticket:
    ```json
    {
      "success": true,
      "data": {
        "message": ChatMessage,
        "ticket":  SupportTicket
      }
    }
    ```
- When `asClosure: false`: behaves exactly like the existing reply send; if an active ticket exists, server still stamps `ticketId` on the message for traceability but does **not** change ticket status.

UI mapping: the reply box in [src/pages/SupportPage.jsx:351-378](src/pages/SupportPage.jsx) gains a checkbox "Send as closing reply" (disabled when no active ticket or the active ticket is already `CLOSED`).

---

### 4.6 `GET /support/associates`
Returns the list of Support Associates for assignee dropdowns.

**Response**
```json
{
  "success": true,
  "data": [
    { "id": 12, "name": "Alice", "email": "alice@…", "active": true },
    { "id": 13, "name": "Bob",   "email": "bob@…",   "active": true }
  ]
}
```

Replaces `ASSIGNEES` at [src/pages/SupportPage.jsx:3](src/pages/SupportPage.jsx).

---

### 4.7 `GET /support/tickets/:ticketId/notes`
List notes for a ticket, oldest first (chronological). Powers the Notes timeline in the View Active Ticket modal.

**Query params**
| Param  | Type    | Default | Notes |
|--------|---------|---------|-------|
| `page` | integer | `1`     | optional; tickets usually have few notes — pagination is a safety net |
| `size` | integer | `50`    | max `100` |
| `sort` | string  | `createdAt` | `createdAt` (oldest first) or `-createdAt` (newest first) |

**Response**
```json
{
  "success": true,
  "data": [ TicketNote, ... ],
  "meta": { "page": 1, "size": 50, "total": 4, "totalPages": 1 }
}
```

---

### 4.8 `POST /support/tickets/:ticketId/notes`
Append a new note to the ticket.

**Request**
```json
{ "text": "Spoke to dev team — root cause is the cached entitlements service." }
```
- `text` required, non-empty, max ~4 000 chars.
- `author` is taken from the authenticated user; clients must not send it.
- Rejected with `409 TICKET_CLOSED` if `ticket.status === "CLOSED"` (notes are only appendable on open tickets; relax later if needed).

**Response:** `201 Created` with `{ success: true, data: TicketNote }`.

Side-effects:
- Updates the parent ticket's `updatedAt` and increments `noteCount`.
- Does **not** post anything to the customer-facing chat thread — notes are internal.

---

### 4.9 `DELETE /support/tickets/:ticketId/notes/:noteId` (optional, v1.1)
Soft-delete a note. Only the author or an admin may delete. Returns `204 No Content`.

Out of scope for the initial UI; document here so the resource shape is clear.

---

## 5. "Close with reply" flow — end-to-end

1. Associate clicks **Send as closing reply** in the reply box.
2. Client → `POST /support/threads/:threadId/messages` with `asClosure: true`.
3. Server, in one transaction:
   - inserts a `ChatMessage` (`kind: "closure"`, `ticketId = activeTicket.id`, `sender: "agent"`),
   - updates the active ticket: `status = CLOSED`, `closedAt`, `closedBy`, `closingMessageId`,
   - emits a `system` message: `"Ticket {ticketCode} marked Closed by {associateName}"`.
4. Response carries both `{ message, ticket }`; UI:
   - appends the closure-reply bubble to the message list,
   - updates the Active Ticket card (status → Closed, age frozen).
5. The thread itself stays open; another ticket can be raised later via §4.1 and becomes the new active ticket.

---

## 6. Invariants & edge cases

- **At most one open ticket per thread.** "Open" means `status ∈ {DRAFT, IN_PROGRESS}`. Trying to raise a new ticket while an open ticket exists → `409 TICKET_ALREADY_OPEN`. UI: swap the "Create Ticket" FAB for "View Active Ticket" in that case (see [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx)).
- **`activeTicket` is always the most-recently-created**, regardless of status. A `CLOSED` ticket remains "active" (and visible on the card) until a new ticket is raised. This keeps the UI stable after a closure lands.
- **Conversation Age ≠ Ticket Age.** Thread header continues to show "Age: N days" from the **first message** ([src/pages/SupportPage.jsx:73-77](src/pages/SupportPage.jsx)); the ticket card shows "Age: N days" from `ticket.createdAt`.
- **No active ticket:** the right panel shows a slim placeholder card with a single `Raise Ticket` CTA in place of the assignee/tag/status row.
- **Permissions** (out of scope for this contract, but flag at implementation): only Support Associates can `PATCH` tickets, add notes, or send closing replies; viewers can read.

---

## 7. UI wiring notes

When integrating into [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx):

1. Add `src/lib/supportTicketsApi.js` exporting:
   `listThreadTickets`, `getTicket`, `createTicket`, `updateTicket`, `listAssociates`, `listTicketNotes`, `createTicketNote`.
   Mirror the style of [src/lib/leadsApi.js](src/lib/leadsApi.js).
2. Remove the local `ASSIGNEES` / `STATUSES` constants ([src/pages/SupportPage.jsx:3,5](src/pages/SupportPage.jsx)); load associates on mount via `GET /support/associates` and use the ticket-status enum from this doc.
3. Replace the `handleChatMetaChange` flow at [src/pages/SupportPage.jsx:169-174](src/pages/SupportPage.jsx) — those dropdowns now `PATCH /support/tickets/:id` against `activeTicket.id`, not the thread.
4. Add a new **`<ActiveTicketCard />`** component rendered between the thread header and the messages list. Inside it: ticket code, age (live-computed from `createdAt`), Assignee/Tag/Status dropdowns, `Raise New Ticket` button (disabled per §6), and `Previous Tickets (N)` button (visible when `ticketCount > 1`).
5. Add a new **`<PreviousTicketsModal />`** opened by that button — fetches `GET /support/threads/:id/tickets`, renders newest-first list; click a row → fetch `GET /support/tickets/:id` → drill-in modal.
6. Add a **`<ViewActiveTicketModal />`** opened by the "View Active Ticket" FAB — fetches `GET /support/tickets/:id` (which embeds `notes[]`) or hits `GET /support/tickets/:id/notes` separately. Renders the editable meta grid (Assignee / Tag / Status) and the **Notes timeline**: oldest-first list of `TicketNote` entries, with an inline composer that calls `POST /support/tickets/:id/notes` and appends the returned note. ⌘/Ctrl + Enter submits.
7. Extend the reply box with a "Send as closing reply" checkbox; on send, route through the extended `POST /messages` endpoint and merge both the new message and the updated ticket into local state. Disable when no active ticket or when the active ticket is already `CLOSED`.
8. Treat the legacy `chat.status` / `chat.assignee` / `chat.tag` fields as read-only mirrors of `activeTicket` for one release; remove in a follow-up.

---

## 8. Out of scope

- Ticket SLA timers, escalation rules, auto-assign round-robin.
- Ticket-level attachments (separate from message-level attachments).
- Cross-thread ticket search / global ticket inbox (would be `GET /support/tickets?...`, easy to add later using the same `SupportTicket` shape).
- Audit log endpoint (the `system` chat messages provide a lightweight in-thread audit trail in the meantime).
