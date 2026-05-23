# Support Inbox API — Delta: Ticket Notes

**Purpose.** Adds a chronological **internal notes** feature on a `SupportTicket`. Notes are written by support associates while a ticket is open; they are **never** sent to the customer chat thread. This delta extends the consolidated *Support Inbox API — Integration Guide* — apply the changes below into the relevant sections of that document. No existing fields, endpoints, or response shapes are changed in incompatible ways.

Audience: backend engineer implementing the support API.

---

## Summary of changes

1. New entity `TicketNote` (§2 of the guide).
2. New fields on `SupportTicket`: `noteCount`, optional embedded `notes[]` on the single-ticket fetch.
3. Two new endpoints: list notes / create note. One optional v1.1 endpoint: delete note.
4. New error code: `TICKET_RESOLVED` (used when trying to write a note on a resolved ticket).
5. Quick-reference route table additions.

---

## 1. New domain object — `TicketNote`

Add as §2.5 of the guide.

Internal, chronological log entries attached to a ticket. **Not visible to the customer.** Distinct from `ChatMessage` (which lives on the thread and may be customer-facing).

| Field        | Type                          | Notes |
|--------------|-------------------------------|-------|
| `id`         | integer                       | server-assigned |
| `ticketId`   | integer                       | FK → `SupportTicket` |
| `text`       | string                        | required, non-empty, max ~4 000 chars |
| `author`     | `{ id: int, name: string }`   | the admin who wrote the note; server-stamped from the auth context — clients must not send it |
| `createdAt`  | ISO-8601                      | used for chronological ordering (oldest first in the UI) |
| `editedAt`   | ISO-8601 \| null              | reserved for v1.1; always `null` in v1 |

---

## 2. Additions to `SupportTicket` (§2.2)

Add two fields. Both are backwards-compatible additions — existing clients ignore unknown fields.

| Field        | Type                       | Notes |
|--------------|----------------------------|-------|
| `noteCount`  | integer                    | total notes attached to this ticket; convenience field for list views (the View Active Ticket modal renders "Follow-up Notes (N)") |
| `notes`      | `TicketNote[]` \| omitted  | **embedded only on `GET /tickets/:id`** (see §3.5 of the guide). List endpoints (`GET /threads`, `GET /threads/:id/tickets`) must omit this field to keep payloads small. Notes are fetched via §3.8 below. |

No other fields change.

---

## 3. New endpoints

All routes are mounted under `/restricted/support/...`, require `X-Access-Token`, and follow the standard response envelope from §1 of the guide.

### 3.8  `GET /restricted/support/tickets/{ticketId}/notes`

List notes for a ticket. Powers the **Follow-up Notes** timeline inside the View Active Ticket panel ([src/pages/SupportPage.jsx](src/pages/SupportPage.jsx)).

**Permission:** `support.view`.

**Query parameters**

| Param   | Type    | Default      | Notes |
|---------|---------|--------------|-------|
| `page`  | integer | `1`          | optional; tickets usually have few notes — pagination is a safety net |
| `size`  | integer | `50`         | max `100` |
| `sort`  | string  | `"createdAt"`| `"createdAt"` (oldest first, default — matches the UI timeline) or `"-createdAt"` (newest first) |

**Example request**
```
GET /restricted/support/tickets/31/notes?sort=createdAt
X-Access-Token: <token>
```

**Example response**
```json
{
  "success": true,
  "data": [
    {
      "id": 901,
      "ticketId": 31,
      "text": "Spoke to dev team — root cause is the cached entitlements service.",
      "author": { "id": 4, "name": "Priya" },
      "createdAt": "2026-05-22T11:42:00Z",
      "editedAt": null
    },
    {
      "id": 902,
      "ticketId": 31,
      "text": "Service restarted; will verify with the user.",
      "author": { "id": 4, "name": "Priya" },
      "createdAt": "2026-05-22T12:10:00Z",
      "editedAt": null
    }
  ],
  "meta": { "page": 1, "size": 50, "total": 2, "totalPages": 1 }
}
```

**Failure modes**

| Status | Code | When |
|--------|------|------|
| 404 | `NOT_FOUND` | unknown `ticketId` |

---

### 3.9  `POST /restricted/support/tickets/{ticketId}/notes`

Append a new note to the ticket.

**Permission:** `support.reply`.

**Request**
```json
{ "text": "Spoke to dev team — root cause is the cached entitlements service." }
```

- `text` is required, non-empty, ≤ 4 000 chars (server trims trailing whitespace before checking length).
- `author` is **not accepted** from clients — server stamps it from the authenticated admin.

**Success** — `201 Created`
```json
{ "success": true, "data": TicketNote }
```

**Side effects**

- Bumps the parent ticket's `updatedAt` and increments `noteCount`.
- Does **not** post anything to the customer-facing chat thread. Notes are internal-only.
- Does **not** emit a `system` message on the thread (keeps the chat timeline focused on customer-visible events).

**Failure modes**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | empty `text`, or `text` over the length cap |
| 404 | `NOT_FOUND` | unknown `ticketId` |
| 409 | `TICKET_RESOLVED` | the ticket's current status is `RESOLVED`. Notes are appendable only on open tickets (`DRAFT` / `IN_PROGRESS`). Re-open the ticket via `PATCH /tickets/:id` to resume writing notes. |

UI mapping: the "Add" button beside the *Enter Follow Up Comments...* textarea in the View Active Ticket panel is disabled when the active ticket's status is `RESOLVED`, mirroring the server rule.

---

### 3.10  `DELETE /restricted/support/tickets/{ticketId}/notes/{noteId}` *(optional, v1.1)*

Soft-delete a note. **Out of scope for the initial UI** — included here so the resource shape is unambiguous for the implementer.

**Permission:** `support.reply`, AND the caller must be either the note's `author` or hold an admin role (TBD when the role taxonomy is finalized).

**Response:** `204 No Content`.

The list endpoint (§3.8) should omit soft-deleted notes by default; a future `?includeDeleted=true` query flag may surface them for audit views.

---

## 4. Additions to the error-code table (§1)

Append one row:

| HTTP | `error.code`       | When |
|------|--------------------|------|
| 409  | `TICKET_RESOLVED`  | `POST /tickets/:id/notes` against a ticket whose `status` is already `RESOLVED`. |

---

## 5. Additions to §8 — Quick reference (route table)

Append the new routes at the bottom of the table:

| Verb   | Path                                                | Permission       |
|--------|-----------------------------------------------------|------------------|
| GET    | `/restricted/support/tickets/{ticketId}/notes`      | `support.view`   |
| POST   | `/restricted/support/tickets/{ticketId}/notes`      | `support.reply`  |
| DELETE | `/restricted/support/tickets/{ticketId}/notes/{noteId}` *(v1.1)* | `support.reply` |

---

## 6. Client integration (delta to §6 of the guide)

Extend `src/lib/supportApi.js` with two functions:

- `listTicketNotes(ticketId, { page, size, sort } = {})`
- `createTicketNote(ticketId, { text })`

Inside the `<ViewActiveTicketModal />` component (the slide-up panel at the bottom of the right pane in [src/pages/SupportPage.jsx](src/pages/SupportPage.jsx)):

- On open, call `listTicketNotes(activeTicket.id)` with the default `sort=createdAt` (oldest first → newest last, matching the rendered timeline).
- The composer ("Enter Follow Up Comments...") posts via `createTicketNote`. On success, append the returned `TicketNote` to local state — don't refetch the whole list.
- Disable the **Add** button when `activeTicket.status === "RESOLVED"`. If the server returns `409 TICKET_RESOLVED` anyway (race against another admin), surface a small inline warning under the textarea and refresh `activeTicket`.

If the client also fetches the full ticket via `getTicket(id)` (§3.5 of the guide), the embedded `notes[]` can seed local state without a second round-trip — but the list endpoint (§3.8) remains the canonical fetch path for pagination and re-fetch.

---

## 7. Out of scope (intentionally deferred)

- Editing a note (`editedAt` exists in the schema but is not exposed by any v1 endpoint).
- Mentions / notifications on note creation.
- Note-level attachments.
- Cross-ticket notes search (would be `GET /support/notes?...`).

These can be layered on later without breaking the v1 contract above.
