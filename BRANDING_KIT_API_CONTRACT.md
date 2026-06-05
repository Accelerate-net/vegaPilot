# Branding Kit API Contract

Addendum to `DIGITAL_SIGNAGE_API_CONTRACT.md`. Same conventions apply (ULID
ids, ISO‑8601 UTC timestamps, `true`/`false` booleans, `{ data, meta }`
pagination, Bearer admin auth, soft deletes, error format from §11).

Admin API base path: `/api/v1/signage` (same as the rest of the signage module).

---

## 1. Purpose

A **Branding Kit** is a reusable bundle of brand assets (logo, company display
name, tag lines, keywords). It is pulled into **Animated Branding** loop items
(`content_type = 'BRANDING'`) so the same brand identity can be reused across
many loops without re‑entering it each time.

A kit can be **targeted at a set of branches**. An empty branch set means the
kit is **global** (available to every branch), mirroring the `branch_id = null`
= global semantics already used for loops/media (§1.3 of the main contract).
Multiple kits may exist and overlap branches; the admin picks which kit a given
loop item uses.

---

## 2. Database schema

### 2.1 `signage_branding_kits`

```sql
CREATE TABLE signage_branding_kits (
  id            CHAR(26) PRIMARY KEY,                 -- ULID
  display_name  VARCHAR(160) NOT NULL,                -- e.g. "Crispr Learning"
  logo_url      VARCHAR(2048) NULL,                   -- Bunny.net CDN URL (uploaded client-side)
  taglines      JSON NOT NULL,                        -- ["...", "..."] each <= 120 chars
  keywords      JSON NOT NULL,                        -- ["IISER","NISER","IAT","Expert Teachers"]
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id BIGINT NULL,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  deleted_at    TIMESTAMP NULL,
  INDEX (is_active)
);
```

`taglines` and `keywords` are stored as JSON string arrays. If you prefer
normalised tables that is fine — the **wire format is always a JSON array of
strings** (see §4).

### 2.2 `signage_branding_kit_branch` (which branches a kit applies to)

```sql
CREATE TABLE signage_branding_kit_branch (
  branding_kit_id CHAR(26) NOT NULL,
  branch_id       CHAR(26) NOT NULL,
  PRIMARY KEY (branding_kit_id, branch_id),
  FOREIGN KEY (branding_kit_id) REFERENCES signage_branding_kits(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id)       REFERENCES signage_branches(id)      ON DELETE CASCADE
);
```

No rows for a kit ⇒ global (all branches).

---

## 3. Entity wire format

Every endpoint that returns a kit returns this exact shape. `branch_ids` is the
flattened list from the join table.

```json
{
  "id":           "01J8…",
  "display_name": "Crispr Learning",
  "logo_url":     "https://cdn.bunny.net/digital-signage/uuid_2026-05-28_logo.png",
  "taglines":     ["Learn from the best", "Crack IISER & NISER"],
  "keywords":     ["IISER", "NISER", "IAT", "Expert Teachers"],
  "branch_ids":   ["01J8…", "01J9…"],
  "is_active":    true,
  "created_at":   "2026-05-28T09:30:00Z",
  "updated_at":   "2026-05-28T09:30:00Z"
}
```

Field notes:
- `logo_url` — the file is uploaded to Bunny.net by the admin SPA; the API only
  stores/returns the resulting CDN string. May be `null`.
- `taglines` / `keywords` — always arrays; return `[]` (never `null`) when empty.
- `branch_ids` — always an array; `[]` means global.

---

## 4. Admin REST API

All routes prefix `/api/v1/signage`. Sanctum middleware + RBAC (see §6).

| Method | Path                    | Body / notes |
|--------|-------------------------|--------------|
| GET    | `/branding-kits`        | List, paginated. Query: `?branch_id=`, `?is_active=`, `?search=` (matches `display_name`). Returns `{ data: [kit…], meta }`. |
| POST   | `/branding-kits`        | Create. Body below. Returns the full kit (§3). |
| GET    | `/branding-kits/{id}`   | Single kit. |
| PATCH  | `/branding-kits/{id}`   | Partial update. Any subset of the create body. For `taglines`/`keywords`/`branch_ids`, the array sent **replaces** the stored array (not merged). |
| DELETE | `/branding-kits/{id}`   | Soft delete. See §5 for the effect on loop items. |

`?branch_id=` filter semantics: return kits whose branch set **contains** that
branch **OR** that are global (empty branch set) — same rule the FE applies
client‑side today.

### Create / update body

```jsonc
{
  "display_name": "Crispr Learning",   // required, string, max 160
  "logo_url":     "https://cdn…/logo.png", // nullable string (URL)
  "taglines":     ["line 1", "line 2"],    // array of strings, each max 120 chars
  "keywords":     ["IISER", "NISER"],      // array of strings
  "branch_ids":   ["01J8…"],               // array of branch ULIDs; [] or omitted = global
  "is_active":    true                     // boolean, default true
}
```

The frontend client (`src/lib/signageApi.js → BrandingKits`) sends exactly these
field names and expects the §3 shape back.

---

## 5. Effect on loop items (Animated Branding)

When an admin builds a `BRANDING` loop item they pick a kit. The admin stores
this in the loop item `payload` (§4 of the main contract) as:

```jsonc
// payload for content_type = "BRANDING"
{
  "branding_kit_id": "01J8…",
  "branding": {                         // denormalised snapshot taken at save time
    "display_name": "Crispr Learning",
    "logo_url":     "https://cdn…/logo.png",
    "taglines":     ["…"],
    "keywords":     ["…"]
  },
  // existing optional branding fields still allowed:
  "background_style": "particles", "animation_preset": "…", "media_url": "…"
}
```

**Recommended player behaviour** (player API, §6.1 of the main contract): when
hydrating a `BRANDING` item that carries a `branding_kit_id`, **re‑resolve the
kit server‑side and overwrite `data.branding` with the kit's current values**,
so edits to a kit propagate to already‑built loops. Fall back to the embedded
`branding` snapshot if the kit was deleted. If you do not re‑resolve, the
snapshot is used as‑is (edits won't propagate).

**On kit delete:** do **not** cascade‑break loop items. Leave the snapshot in
`payload.branding` so screens keep rendering; `branding_kit_id` simply stops
resolving. (A 409‑on‑in‑use rule is not required.)

---

## 6. RBAC permissions

Add alongside the existing signage permissions (§1.3 of the main contract):

| Permission                     | Scope  |
|--------------------------------|--------|
| `signage.branding.view`        | global |
| `signage.branding.manage`      | global |

Branding kits are brand‑level assets, so treat them as **global** (like
branches): visible to any signage admin, editable only with `.manage`. Add
`signage.branding.*` to `SIGNAGE_SUPER_ADMIN` and `SIGNAGE_CONTENT_MANAGER`,
`.view` to `SIGNAGE_VIEWER`.

---

## 7. Validation rules (Form Request)

```php
// CreateBrandingKitRequest / UpdateBrandingKitRequest (use 'sometimes' on update)
[
  'display_name' => ['required','string','max:160'],
  'logo_url'     => ['nullable','string','url','max:2048'],
  'taglines'     => ['array'],
  'taglines.*'   => ['string','max:120'],
  'keywords'     => ['array'],
  'keywords.*'   => ['string','max:80'],
  'branch_ids'   => ['array'],
  'branch_ids.*' => ['ulid','exists:signage_branches,id'],
  'is_active'    => ['boolean'],
]
```

---

## 8. Errors

Standard envelope and codes from §11 of the main contract
(`VALIDATION_FAILED` 422, `NOT_FOUND` 404, `FORBIDDEN` 403, `SERVER_ERROR` 500).
No branding‑specific error codes are required.
