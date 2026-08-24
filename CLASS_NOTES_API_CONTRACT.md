# Class Notes — Backend API Contract (v2)

**Audience:** the backend team.
**Goal:** support the **Class Notes** admin page (React: `/class-notes`, legacy:
`class-notes.html`), where an admin picks a **Chapter**, selects the **batches**
the note is visible to, attaches a **PDF** (≤ **15 MB**), uploads it to Bunny
Edge Storage, and the file's metadata — including its **SHA-256 checksum** — is
persisted. The checksum is the dedupe key: the same document must not be
storable twice.

**Consumer:** the student mobile app shows these files in the **Resources**
section of the chapter a student is watching — but only when the student
belongs to one of the note's linked batches (a note with **no** linked batches
is visible to **every** batch). The student-facing endpoint is out of scope
here; this contract covers the admin surface.

**v2 changes vs v1:** max size dropped 200 MB → **15 MB**; new `checksumSha256`
on upload + metadata (unique, dedupe); new `courseIds` (a chapter can be part
of 1+ course bundles — the note is published under the selected ones) and
`batchIds` visibility list; new duplicate-probe endpoint (§2.5); list gains
`courseId` + `batchId` filters and returns `checksumSha256` + `courses` +
`batches` per row.

**Auth:** every endpoint below sits behind the standard admin auth — the FE
sends the header `X-Access-Token: <adminToken>` on every call. (401/403 handled
by the existing middleware.)

**Base URL:** the FE resolves the host at runtime:
- local: `http://localhost:3000`
- prod: `https://crisprtech.app/crispr-apis`

---

## Overview of the flow

```
                 ┌─────────────────────────────────────────────┐
  Admin picks    │ 1. POST …/classnotes/upload-classnote.php    │  PDF → Bunny
  chapter + PDF  │    (multipart: file, path=class-notes, …)    │  Storage (BE-held key)
        │        └─────────────────────────────────────────────┘
        │                         │ returns { fileUrl }
        ▼                         ▼
                 ┌─────────────────────────────────────────────┐
                 │ 2. POST …/classnotes/update-classnotes-      │  persist row
                 │    metadata.php  (JSON: { chapterId, fileUrl })
                 └─────────────────────────────────────────────┘

  Page load / after upload / on filter change:
                 ┌─────────────────────────────────────────────┐
                 │ 3. GET …/classnotes/list-classnotes-         │  list rows
                 │    metadata.php?chapterId&searchKey&…        │
                 └─────────────────────────────────────────────┘
```

Three endpoints, all under `/restricted/classnotes/` and behind the existing
`X-Access-Token` middleware (see §1, §2, §3).

---

## 1. File upload — `POST /restricted/classnotes/upload-classnote.php`

The FE posts the raw PDF here; the backend stores it in Bunny Edge Storage
(folder `class-notes`) with the access key held **server-side**, and returns the
resulting CDN URL. This is step 1 of 2 — it does **not** persist the row (that's
§2), so the same file can be validated/stored before it's linked to a chapter.

**Body:** `multipart/form-data`, header `X-Access-Token`.

| field | required | value |
|-------|----------|-------|
| `file` | yes | the PDF binary |
| `path` | yes | `class-notes` |
| `fileName` | yes | FE-generated stored name (convention below) |
| `checksumSha256` | yes | lowercase hex SHA-256 of the raw file bytes, computed client-side. Recompute server-side and reject on mismatch (`CHECKSUM_MISMATCH`, 422). If a class-note row with this checksum already exists, reject with `DUPLICATE_FILE` (409) and skip the Bunny upload. |

```bash
curl -X POST "$BASE/restricted/classnotes/upload-classnote.php" \
  -H "X-Access-Token: $TOKEN" \
  -F "file=@/path/to/Cell The Unit Life.pdf;type=application/pdf" \
  -F "path=class-notes" \
  -F "fileName=9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa.pdf" \
  -F "checksumSha256=9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa"
```

**Stored-name convention** (FE-generated; re-validate server-side as a fallback):
```
{checksumSha256}.pdf
e.g.  9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa.pdf
```
The Bunny object is named by the file's own SHA-256, so identical content maps
to one object name and the zone can never hold the same document twice. The
human-readable name lives in the metadata row's `displayName` (the Title the
admin enters, §2) — never in the object name.

**Validation (server-side; do not trust the client):**
- Content type **`application/pdf`** only (also `.pdf`) → else `UNSUPPORTED_TYPE`.
- Size ceiling **15 MB** → else `FILE_TOO_LARGE`. (The FE also blocks >15 MB
  client-side and shows ideal-size guidance: ~500 KB for 3–4 pages, ~2 MB for
  10–12 pages, ~5 MB for 20–25 pages.)
- `checksumSha256` matches the received bytes → else `CHECKSUM_MISMATCH`.
- No existing row with the same checksum → else `DUPLICATE_FILE` (409).

**Response 200** — the FE reads **`fileUrl`** (it also tolerates `url` /
`ObjectName` as fallbacks):
```json
{
  "status": "success",
  "data": {
    "fileUrl": "https://<pull-zone>.b-cdn.net/class-notes/a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf",
    "fileName": "a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf",
    "fileSize": 184320
  }
}
```

> `class-notes` PDFs may be non-public. If the pull zone is public and that's a
> concern, use token-authenticated URLs or a private zone — the FE only needs a
> working `fileUrl` back, so it's a BE-side choice.

**Error envelope** (project standard, FE reads `error.code` / `error.message`):
```json
{ "error": { "code": "UNSUPPORTED_TYPE", "message": "…", "details": null } }
```
Relevant codes: `FILE_TOO_LARGE` (422), `UNSUPPORTED_TYPE` (422),
`CHECKSUM_MISMATCH` (422), `DUPLICATE_FILE` (409), `UPSTREAM_FAILED` (502).

---

## 2. Persist metadata — `POST /restricted/classnotes/update-classnotes-metadata.php`

Called by the FE **after** the upload succeeds, to link the stored file to its
chapter and batches.

**Request** — `application/json`, header `X-Access-Token`:
```json
{
  "chapterId": 8,
  "courseIds": ["70001", "70002"],
  "fileUrl": "https://<pull-zone>.b-cdn.net/class-notes/a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf",
  "fileName": "a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf",
  "displayName": "Cell The Unit Life.pdf",
  "fileSize": 184320,
  "checksumSha256": "9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa",
  "batchIds": ["12", "17"]
}
```

```bash
curl -X POST "$BASE/restricted/classnotes/update-classnotes-metadata.php" \
  -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "chapterId": 99, "fileUrl": "https://…/notes.pdf", "checksumSha256": "9f2c…e1aa", "batchIds": [] }'
```

| field | type | notes |
|-------|------|-------|
| `chapterId` | int | FK to the syllabus chapter (see §4) |
| `courseIds` | array | course-bundle ids (from `/restricted/course/list-bundles`) the note is published under; **required, at least one** (a chapter can be part of 1+ courses) |
| `fileUrl` | string | CDN URL returned by §1 |
| `fileName` | string | Bunny object name returned by §1 (`<sha256>.pdf`) |
| `displayName` | string | the **Title** the admin entered — shown in the admin list and to students in the app. Charset `[A-Za-z0-9_-]` only (the FE defaults it to the original file name in `Proper_Case` and enforces the charset; re-validate server-side) |
| `fileSize` | int | bytes |
| `checksumSha256` | string | lowercase hex; **unique** across class notes → reject a duplicate with `DUPLICATE_FILE` (409) |
| `batchIds` | array | batch ids (from `/restricted/enrollment/list-batches`) the note is visible to; **empty array = visible to all batches** |

**Server derives / stamps the rest:** `id` (new PK), `uploadedOn` (server time),
`createdBy` (from the token), and — for the list view — `chapterTitle` /
`subject` (join the chapter), `fileName` / `displayName` (from the URL basename),
`fileSize` (from storage). The FE will also enrich `chapterTitle` / `subject` /
`displayName` client-side from the syllabus if the row omits them, so returning
just the stored columns is acceptable.

**Behaviour**
- Validate `chapterId` exists, `courseIds` is non-empty and every entry is a
  real course bundle (optionally: one whose syllabus contains `chapterId`),
  `fileUrl` is present, and every `batchIds` entry is a real batch.
- Enforce checksum uniqueness (`DUPLICATE_FILE`, 409). This is the last line of
  dedupe defence — the FE also probes §2.5 before uploading.
- Create a new class-notes row + its course and batch links.
- Return `{ status: "success" }` (a `data` object is welcome but not required —
  the FE re-fetches the list on success).

**Update mode — the "Visibility" action.** When the body carries an **`id`**,
this is an update of an existing row, not a create:
```json
{ "id": 42, "chapterId": 9, "courseIds": ["70001"], "batchIds": ["12"] }
```
- Replace the row's chapter, course links, and batch links with the given
  values (`batchIds: []` = visible to all batches).
- The file fields (`fileUrl`, `fileName`, `fileSize`, `checksumSha256`,
  `displayName`) are **immutable** in update mode — ignore them if sent.
- `404` if the id doesn't exist; same validation as create otherwise.

**Failure** (FE surfaces `message` in a toast — keep it human-readable):
```json
{ "status": "error", "message": "Chapter not found." }
```

---

## 2.5. Duplicate probe — `GET /restricted/classnotes/check-classnote-checksum.php`

Called by the FE as soon as the admin picks a file (checksum is computed
client-side via WebCrypto), so a duplicate is caught **before** any bytes are
uploaded.

**Query params:** `checksum` — lowercase hex SHA-256.

**Response 200, duplicate exists** — return the existing row (same shape as a
§3 row):
```json
{ "status": "success", "data": { "id": 42, "chapterId": 8, "displayName": "Cell The Unit Life.pdf", "…": "…" } }
```

**Response, no duplicate:** either `200` with `data: null` or a plain `404` —
the FE treats both as "not a duplicate". If this endpoint is unreachable the FE
degrades gracefully and relies on the 409 from §1/§2.

---

## 3. List notes — `GET /restricted/classnotes/list-classnotes-metadata.php`

Called on page load, after every successful upload, and on any filter/paging
change. **All filtering and paging is server-side.**

**Query params** (header `X-Access-Token`):

| param | required | example | notes |
|-------|----------|---------|-------|
| `page` | yes | `1` | 1-based |
| `size` | yes | `50` | page size (FE offers 10/20/50/100) |
| `includeHidden` | no | `true` | include soft-hidden rows; default `false` |
| `chapterId` | no | `99` | filter to one chapter |
| `courseId` | no | `70001` | filter to notes published under one course bundle |
| `batchId` | no | `12` | filter to notes visible to one batch (notes with no batch links are visible to all, so they match every `batchId`) |
| `searchKey` | no | `Resume` | free-text match (chapter/subject/file name) |

```bash
curl -G "$BASE/restricted/classnotes/list-classnotes-metadata.php" \
  -H "X-Access-Token: $TOKEN" \
  --data-urlencode "chapterId=99" \
  --data-urlencode "searchKey=Resume" \
  --data-urlencode "includeHidden=true" \
  --data-urlencode "page=1" \
  --data-urlencode "size=50"
```

**Response 200** — array under `data`, plus paging metadata
(`page`, `size`, `total`, `totalPages`) mirroring the catalog endpoint:
```json
{
  "status": "success",
  "data": [
    {
      "id": 42,
      "chapterId": 8,
      "chapterTitle": "Cell: The Unit of Life",
      "subject": "Biology",
      "fileName": "a1b2c3d4-…_28072026_Cell_The_Unit_Life.pdf",
      "displayName": "Cell The Unit Life.pdf",
      "fileUrl": "https://<pull-zone>.b-cdn.net/class-notes/…",
      "fileSize": 184320,
      "checksumSha256": "9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa",
      "courses": [{ "id": "70001", "title": "IAT 2026 – Exclusive 1 Year Course" }],
      "batches": [{ "id": "12", "name": "IAT 2026 Morning" }],
      "hidden": false,
      "uploadedOn": 1753660800
    }
  ],
  "page": 1,
  "size": 50,
  "total": 1,
  "totalPages": 1
}
```

**Field mapping the FE tolerates** (send the **canonical** name; aliases only if
convenient). Only `id`, `chapterId`, and `fileUrl` are truly required — the FE
enriches `chapterTitle` / `subject` / `displayName` from the syllabus and the URL
when absent:

| canonical | accepted aliases |
|-----------|------------------|
| `chapterId` | `fk_id_chapter` |
| `chapterTitle` | `title` |
| `fileName` | `objectName` |
| `displayName` | `originalName`, `fileName` |
| `fileUrl` | `url`, `cdnUrl` |
| `fileSize` | `size` |
| `checksumSha256` | `checksum`, `sha256` |
| `courses` | `courseIds` (+ parallel `courseNames`) |
| `batches` | `batchIds` (+ parallel `batchNames`) |
| `hidden` | `isHidden` |
| `uploadedOn` | `createdOn` |

`uploadedOn` may be a **unix timestamp (seconds)** or an **ISO-8601 string** —
the FE handles both. Rows array may sit under `data` or `notes`. If paging
metadata is omitted, the FE falls back to `data.length` as the total.

---

## 4. Data model (suggested)

```
class_notes
  id              PK
  fk_id_chapter   int          -- chapterId (references the syllabus chapter)
  chapter_title   varchar      -- denormalised snapshot
  subject         varchar      -- denormalised snapshot (module name)
  file_name       varchar      -- Bunny object name (unique)
  display_name    varchar      -- original upload name
  file_url        varchar      -- Bunny CDN URL
  file_size       bigint       -- bytes
  checksum_sha256 char(64)     -- lowercase hex; UNIQUE index (the dedupe key)
  uploaded_by     int          -- admin id from token
  uploaded_on     datetime

class_note_courses               -- publication links; at least one per note
  fk_id_class_note int          -- FK class_notes.id (cascade delete)
  fk_id_course     int          -- FK course-bundle id
  PRIMARY KEY (fk_id_class_note, fk_id_course)

class_note_batches               -- visibility links; no rows = visible to all
  fk_id_class_note int          -- FK class_notes.id (cascade delete)
  fk_id_batch      int          -- FK enrollment batch id
  PRIMARY KEY (fk_id_class_note, fk_id_batch)
```

**Student app query** (for the mobile team's reference): a note is shown in a
chapter's Resources section when `fk_id_chapter` matches the chapter being
watched AND the course being watched is among the note's `class_note_courses`
AND (the note has **no** `class_note_batches` rows OR the student's batch is
among them).

**Chapter source:** the FE's Chapter dropdown is currently populated from
`SYLLABUS_FIXED.json` (segment → module → chapter), so `chapterId` matches the
`id` field there. If you expose chapters via an API instead, tell the FE the
endpoint and we'll switch the dropdown to it.

---

## 5. Out of scope (not built by the FE yet)

- **Delete** — if you want a delete action, expose
  `POST /restricted/classnotes/delete-classnotes-metadata.php` **and** delete the
  Bunny object via `DELETE /restricted/storage/bunny/file?path=class-notes/<fileName>`
  (already in the storage contract). Say the word and I'll wire the FE button.
- **Edit / replace file** — same pattern as invoices' replace semantics
  (§4.1 of the storage contract).

---

## 6. Build checklist

- [ ] `POST /restricted/classnotes/upload-classnote.php` — store PDF in Bunny (`class-notes` folder, key server-side), PDF-only, ≤**15 MB**, verify + dedupe on `checksumSha256`; return `{ status, data: { fileUrl } }`.
- [ ] `POST /restricted/classnotes/update-classnotes-metadata.php` — persist row from `{ chapterId, courseIds, fileUrl, fileName, displayName, fileSize, checksumSha256, batchIds }`; `courseIds` non-empty; unique checksum → 409 `DUPLICATE_FILE`; with `id` → update-mode (chapter/courses/batches only); return `{ status }`.
- [ ] `GET  /restricted/classnotes/check-classnote-checksum.php` — duplicate probe by checksum.
- [ ] `GET  /restricted/classnotes/list-classnotes-metadata.php` — server-side `page`/`size`/`chapterId`/`courseId`/`batchId`/`searchKey`/`includeHidden`; rows include `checksumSha256` + `courses` + `batches`; return `{ status, data: [], page, size, total, totalPages }`.
- [ ] `class_notes` table with a **UNIQUE index on `checksum_sha256`** + `class_note_courses` and `class_note_batches` join tables.
- [ ] All endpoints behind the existing `X-Access-Token` middleware.
- [ ] RBAC: new permission keys `classNotes.view` / `classNotes.edit` in `App\Enums\Permission` (the FE gates the page on `.view` and the upload form on `.edit`).
- [ ] Student app: chapter Resources endpoint filters by the student's batch (see §4).
