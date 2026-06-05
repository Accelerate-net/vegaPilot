# Bunny.net Shared Storage — Backend API Contract

**Audience:** the backend (Laravel) repo.
**Goal:** turn the signage-only Bunny Storage proxy into a **shared storage layer**
that any module can use, and route **asset invoices** through it (folder
`asset-invoices`).

The frontend already consumes this contract via:
- `src/lib/bunnyStorageApi.js` — the shared client (generic proxy).
- `src/lib/bunnyMediaApi.js` — signage wrapper (folder `digital-signage`).
- `src/lib/assetsApi.js` — asset invoices (folder `asset-invoices`, BE-forwarded).

> **Security invariant (unchanged):** the Bunny Storage **access key never
> reaches the browser**. Every call below is browser → Laravel (X-Access-Token)
> → Bunny Edge Storage (AccessKey held server-side).

---

## 1. What changes

| # | Change | Type |
|---|--------|------|
| 1 | Add a **generic** storage proxy at `/restricted/storage/bunny/*`, folder-allowlisted | New route group (generalises the existing signage proxy) |
| 2 | `POST /restricted/asset/upload-invoice` now **stores the file in Bunny** `asset-invoices/` and returns its CDN URL | Behaviour change |
| 3 | `POST /restricted/asset/remove-invoice` now **deletes the Bunny object** as well as clearing the asset field | Behaviour change |

The existing `/restricted/signage/bunny/*` routes may stay as-is or become thin
aliases of the new generic group (see §2.4). The FE for signage now points at
`/restricted/storage/bunny`.

---

## 2. Generic storage proxy

Base path: **`/restricted/storage/bunny`**
Auth: standard `X-Access-Token` (same middleware as the rest of `/restricted/*`).

### 2.0 Folder allowlist

The proxy operates on a single storage zone, partitioned by **top-level folder**.
Only an explicit allowlist is permitted; any other `path` value is rejected.

```
digital-signage     # Digital Signage media (image/video/audio/Lottie)
asset-invoices      # Asset invoices (PDF/image)
```

- `path` always identifies a folder **relative to the storage-zone root**; the
  proxy prepends the configured zone root, never trusting a client-supplied
  absolute path.
- Reject path traversal: no `..`, no leading `/`, no absolute URLs. The leading
  segment (before the first `/`) **must** be in the allowlist.
- New use cases = add one entry to this allowlist (and a `BUNNY_FOLDERS` entry
  on the FE). No new routes.

### 2.1 `GET /restricted/storage/bunny/list`

List the (non-directory) objects in a folder.

**Query params**
| name | required | example | notes |
|------|----------|---------|-------|
| `path` | yes | `digital-signage` | must be an allowlisted folder (a sub-path like `asset-invoices/2026` is allowed if it resolves under an allowlisted root) |

**Response 200** — Bunny's native listing passed through (PascalCase is fine; the
FE also tolerates a snake_case normalisation):
```json
{
  "data": [
    {
      "Guid": "…",
      "ObjectName": "a1b2…_29052026_invoice.pdf",
      "Length": 184320,
      "IsDirectory": false,
      "LastChanged": "2026-05-29T10:11:12Z",
      "DateCreated": "2026-05-29T10:11:12Z",
      "ContentType": "application/pdf"
    }
  ]
}
```
Include a public `url` / `cdn_url` per object when available — the FE prefers it
for direct linking.

### 2.2 `POST /restricted/storage/bunny/upload`

Upload one file into a folder. **`multipart/form-data`.**

**Form fields**
| field | required | notes |
|-------|----------|-------|
| `file` | yes | the binary |
| `path` | yes | allowlisted folder |
| `fileName` | yes | final object name; FE supplies the convention below |

**Filename convention** (FE-generated, keep it server-side too as a fallback):
```
{uuidv4}_{ddmmYYYY}_{safeBaseName}.{ext}
e.g.  a1b2c3d4-…_29052026_Mar_Invoice.pdf
```
`safeBaseName` is the original name with non-`[A-Za-z0-9-_]` collapsed to `_`.

**Validation (mirror server-side; do not trust the client):**
- Max size **200 MB**.
- Allowed content per folder:
  - `digital-signage`: image/*, video/*, audio/*, `application/json`,
    `application/lottie+json` (also `.json`, `.lottie`).
  - `asset-invoices`: `application/pdf`, image/* (also `.pdf`, `.png`, `.jpg`,
    `.jpeg`, `.webp`, `.gif`).

**Response 200**
```json
{
  "data": {
    "Guid": "…",
    "ObjectName": "a1b2…_29052026_invoice.pdf",
    "Length": 184320,
    "IsDirectory": false,
    "ContentType": "application/pdf",
    "url": "https://<pull-zone>.b-cdn.net/asset-invoices/a1b2…_29052026_invoice.pdf"
  }
}
```

### 2.3 `DELETE /restricted/storage/bunny/file`

Delete a single object.

**Query params**
| name | required | example |
|------|----------|---------|
| `path` | yes | `digital-signage/a1b2…_29052026_clip.mp4` (folder + object name) |

The leading folder segment must be allowlisted. **Response:** `200` or `204`.

### 2.4 Migrating the signage routes

The FE signage client now calls `/restricted/storage/bunny`. Pick one:
- **Preferred:** implement the generic group; make
  `/restricted/signage/bunny/*` forward to it (or delete it once nothing else
  uses it). The kiosk player does **not** use these routes.
- **Minimum:** implement the generic group; leave the signage group untouched.

---

## 3. Error envelope

Use the project-standard error shape so the FE can switch on `error.code`:
```json
{ "error": { "code": "FOLDER_NOT_ALLOWED", "message": "…", "details": null } }
```
Suggested codes:
| code | when | HTTP |
|------|------|------|
| `FOLDER_NOT_ALLOWED` | `path` root not in the allowlist / traversal attempt | 422 |
| `FILE_TOO_LARGE` | over 200 MB | 422 |
| `UNSUPPORTED_TYPE` | content type not allowed for the folder | 422 |
| `UPSTREAM_FAILED` | Bunny returned an error | 502 |
| `NOT_FOUND` | object/folder missing on delete/list | 404 |

(401 / 403 handled by the existing auth middleware.)

---

## 4. Asset invoices (BE-forwarded)

The FE keeps posting the **raw file** to the asset endpoints; the backend
forwards it into the shared storage layer (`asset-invoices` folder). The FE does
**not** call the generic proxy for invoices — it only does client-side
validation (PDF/image, ≤200 MB) for fast feedback.

### 4.1 `POST /restricted/asset/upload-invoice`

**Request** — `multipart/form-data` (unchanged shape):
| field | required | notes |
|-------|----------|-------|
| `id` | yes | asset id |
| `invoice` | yes | the file (PDF or image) |

**New behaviour:**
1. Validate (PDF/image, ≤200 MB).
2. Generate the stored name using the §2.2 convention.
3. Upload into Bunny `asset-invoices/` (reuse the same internal storage service
   the generic proxy uses — this is the "common layer" on the BE side).
4. If the asset already had an invoice, delete the previous Bunny object
   (replace semantics).
5. Persist the resulting **CDN URL** (and/or stored object name) on the asset
   row, e.g. `invoiceURL`.

**Response 200** — return the asset (or at least the invoice fields) so the FE
list refresh shows the link. The FE reads any of these keys:
`invoiceURL`, `invoiceUrl`, `invoicePath`, `invoiceFile`, `invoice`, and treats
`hasInvoice: true|1` as "present".
```json
{ "data": { "id": 123, "invoiceURL": "https://<pull-zone>.b-cdn.net/asset-invoices/a1b2…_29052026_invoice.pdf", "hasInvoice": true } }
```

### 4.2 `POST /restricted/asset/remove-invoice`

**Request** (unchanged): `{ "id": 123 }`

**New behaviour:**
1. Look up the asset's stored invoice object name.
2. Delete it from Bunny `asset-invoices/` (ignore "already gone").
3. Clear the asset's invoice field(s).

**Response 200:** `{ "data": { "id": 123, "hasInvoice": false } }`

---

## 5. Config / ops notes

- Single storage zone, key in server config (e.g. `BUNNY_STORAGE_ZONE`,
  `BUNNY_STORAGE_KEY`, `BUNNY_STORAGE_HOST`, `BUNNY_PULL_ZONE`).
- Keep the **allowlist** and the **per-folder content rules** in one place so
  adding a use case is a one-line change.
- `asset-invoices` likely holds non-public documents — if the pull zone is
  public, consider token-authenticated URLs or a separate private zone; the FE
  only needs a working `url` back, so this is a BE-side choice.
- The legacy `bunny-proxy-server.js` (Stream API demo) is **unrelated** — this
  contract is about Edge **Storage**, not the Stream library.
