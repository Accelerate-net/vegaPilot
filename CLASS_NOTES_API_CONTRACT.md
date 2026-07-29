# Class Notes — Backend API Contract

**Audience:** the backend team.
**Goal:** support the **Class Notes** admin page (`class-notes.html` +
`controllers/class-notes.js`), where an admin picks a **Chapter**, attaches a
**PDF**, uploads it to Bunny Edge Storage, and the file's metadata is persisted.

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

```bash
curl -X POST "$BASE/restricted/classnotes/upload-classnote.php" \
  -H "X-Access-Token: $TOKEN" \
  -F "file=@/path/to/Cell The Unit Life.pdf;type=application/pdf" \
  -F "path=class-notes" \
  -F "fileName=a1b2c3d4-1234-4562-b3fc-2c963f66afa6_30072026_Cell_The_Unit_Life.pdf"
```

**Stored-name convention** (FE-generated; re-validate server-side as a fallback):
```
{uuidv4}_{ddmmYYYY}_{safeBaseName}.pdf
e.g.  a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf
```
`safeBaseName` = original base name with any run of non-`[A-Za-z0-9._-]`
collapsed to `_`.

**Validation (server-side; do not trust the client):**
- Content type **`application/pdf`** only (also `.pdf`) → else `UNSUPPORTED_TYPE`.
- Size ceiling **200 MB** → else `FILE_TOO_LARGE`.

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
`UPSTREAM_FAILED` (502).

---

## 2. Persist metadata — `POST /restricted/classnotes/update-classnotes-metadata.php`

Called by the FE **after** the upload succeeds, to link the stored file to its
chapter. The FE sends a **minimal** body — just the chapter and the URL:

**Request** — `application/json`, header `X-Access-Token`:
```json
{
  "chapterId": 8,
  "fileUrl": "https://<pull-zone>.b-cdn.net/class-notes/a1b2c3d4-…_30072026_Cell_The_Unit_Life.pdf"
}
```

```bash
curl -X POST "$BASE/restricted/classnotes/update-classnotes-metadata.php" \
  -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "chapterId": 99, "fileUrl": "https://…/AbhijithCS_Resume.pdf" }'
```

| field | type | notes |
|-------|------|-------|
| `chapterId` | int | FK to the syllabus chapter (see §4) |
| `fileUrl` | string | CDN URL returned by §1 |

**Server derives / stamps the rest:** `id` (new PK), `uploadedOn` (server time),
`createdBy` (from the token), and — for the list view — `chapterTitle` /
`subject` (join the chapter), `fileName` / `displayName` (from the URL basename),
`fileSize` (from storage). The FE will also enrich `chapterTitle` / `subject` /
`displayName` client-side from the syllabus if the row omits them, so returning
just the stored columns is acceptable.

**Behaviour**
- Validate `chapterId` exists and `fileUrl` is present.
- Create a new class-notes row.
- Return `{ status: "success" }` (a `data` object is welcome but not required —
  the FE re-fetches the list on success).

**Failure** (FE surfaces `message` in a toast — keep it human-readable):
```json
{ "status": "error", "message": "Chapter not found." }
```

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
| `hidden` | `isHidden` |
| `uploadedOn` | `createdOn` |

`uploadedOn` may be a **unix timestamp (seconds)** or an **ISO-8601 string** —
the FE handles both. Rows array may sit under `data` or `notes`. If paging
metadata is omitted, the FE falls back to `data.length` as the total.

---

## 4. Data model (suggested)

```
class_notes
  id            PK
  fk_id_chapter int      -- chapterId (references the syllabus chapter)
  chapter_title varchar  -- denormalised snapshot
  subject       varchar  -- denormalised snapshot (module name)
  file_name     varchar  -- Bunny object name (unique)
  display_name  varchar  -- original upload name
  file_url      varchar  -- Bunny CDN URL
  file_size     bigint   -- bytes
  uploaded_by   int      -- admin id from token
  uploaded_on   datetime
```

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

- [ ] `POST /restricted/classnotes/upload-classnote.php` — store PDF in Bunny (`class-notes` folder, key server-side), PDF-only, ≤200 MB; return `{ status, data: { fileUrl } }`.
- [ ] `POST /restricted/classnotes/update-classnotes-metadata.php` — persist row from `{ chapterId, fileUrl }`; return `{ status }`.
- [ ] `GET  /restricted/classnotes/list-classnotes-metadata.php` — server-side `page`/`size`/`chapterId`/`searchKey`/`includeHidden`; return `{ status, data: [], page, size, total, totalPages }`.
- [ ] `class_notes` table (or equivalent).
- [ ] All three endpoints behind the existing `X-Access-Token` middleware.
