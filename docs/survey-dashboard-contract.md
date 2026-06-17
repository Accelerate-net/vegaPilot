# Contract — `survey` Module · Survey Dashboard (responses + summary)

**Base path:** `{{base_url}}/restricted/survey`
**Status:** Draft / proposed
**Owner (FE):** Survey Dashboard page (`/survey-dashboard?id=<surveyId>`)
**FE client:** [`src/lib/surveysApi.js`](../src/lib/surveysApi.js)
**Page:** [`src/pages/SurveyDashboardPage.jsx`](../src/pages/SurveyDashboardPage.jsx)

This contract covers the **dashboard read path** for a single survey: fetch the
survey definition, page through individual responses, and read a server-side
**consolidated summary** for the response analytics cards. Create / status
endpoints (`/add`, `/update-status`) are listed in §7 for completeness but are
already in use and unchanged.

---

## 1. What the page needs

When the user opens `survey-dashboard?id=101` and clicks **View Responses**, the page must render:

1. **Summary cards** — for each non-text question: average star rating (RATING)
   or per-option percentages (MULTI). Today the FE computes these from the
   responses on the *current page only*, which is wrong once responses span
   multiple pages. **§4.3 (`/summary`) fixes this** by aggregating server-side
   over the entire response set (respecting the same filters).
2. **Responses table** — one row per submission, paginated, with the answers
   laid out per question and the respondent's name/email (unless anonymous).
3. **CSV export** — same rows as the table, all pages (see §6).

---

## 2. Conventions

- **Auth:** `X-Access-Token` header (every `/restricted/*` route).
- **Permissions** (`src/lib/permissions.js` → must map to `App\Enums\Permission`):
  | Key | Gate |
  |---|---|
  | `surveys.view` | get survey / list responses / summary |
  | `surveys.responses.export` | CSV export (§6) |
  | `surveys.edit` | create (§7.1) |
  | `surveys.status.edit` | pause / resume (§7.2) |
  | `surveys.recall` | recall (§7.2) |
- **Envelope (house contract used by `surveysApi.js`):**
  - Success: `{ "success": true, "data": <object|array>, "pagination": { … } }`
  - Error: `{ "success": false, "error": { "code": "STRING_CODE", "message": "Human readable", "fields": { … } } }`
  - The FE's `ensureOk()` throws whenever `success === false`, **even on HTTP 2xx**.
    Always set `success:false` for business errors and use a real 4xx/5xx status.
- **Pagination object** (FE reads `pagination` or `meta`):
  ```jsonc
  { "page": 1, "size": 20, "total": 143, "lastPage": 8 }
  ```
  `total` and `lastPage` are required — the responses pager is server-driven.
- **Timestamps:** unix **seconds** (integers), matching `closesAt` / `submittedAt`
  already in the schema. The FE multiplies by 1000.

---

## 3. Resource shapes

### 3.1 `Survey` (schema row — returned by §4.1)

```jsonc
{
  "id": 101,
  "title": "Post-Mock Feedback — IAT 2026",
  "brief": "Tell us how the mock test went.",          // nullable
  "surveyContent": [                                     // ordered question list (see §3.2)
    { "o": 1, "q": "How clear were the questions?", "t": "RATING", "r": 1 },
    { "o": 2, "q": "Which sections felt hardest?", "t": "MULTI",
      "l": ["Physics", "Chemistry", "Maths"], "r": 1 },
    { "o": 3, "q": "Any other feedback?", "t": "TEXT" }
  ],
  "audienceType": 1,                                     // 0 OPEN | 1 BATCH | 2 ALL_ENROLLED
  "audienceBatchIds": ["b1", "b2"],                     // present when audienceType=1
  "anonymousSubmissionsAllowed": 0,                     // 0 | 1
  "multipleSubmissionsAllowed": 0,                      // 0 | 1
  "closesAt": 1781200000,                               // unix seconds; null = open ended
  "status": 1,                                          // 0 PAUSED | 1 ACTIVE | 2 RECALLED
  "responseCount": 143,                                 // distinct submissions
  "createdBy": "admin_7",
  "createdAt": 1779000000
}
```

Enums (frozen — `src/lib/surveysApi.js`):
- **status:** `0=PAUSED`, `1=ACTIVE`, `2=RECALLED`
- **audienceType:** `0=OPEN (any registered)`, `1=BATCH`, `2=ALL_ENROLLED`
- **question type `t`:** `TEXT`, `RATING` (1–5 stars), `MULTI` (multi-select)

### 3.2 Question (`surveyContent[]` element)

| Field | Type | Notes |
|---|---|---|
| `o` | int | 1-based order. **This is the answer key** — answers reference `o`. |
| `q` | string | Question text |
| `t` | enum | `TEXT` \| `RATING` \| `MULTI` |
| `l` | string[] | Options — **only** for `MULTI` |
| `r` | int (0/1) | Required flag (omitted = not required) |

### 3.3 `Response` (one submission — returned by §4.2)

```jsonc
{
  "id": 55012,
  "fk_id_registered_candidates": 8842,        // null when anonymous
  "studentName": "Asha R",                    // null/absent when anonymous
  "studentEmail": "asha@example.com",         // null/absent when anonymous
  "courseId": "c1",                           // nullable — used by FE course filter
  "batchId": "b1",                            // nullable
  "submittedAt": 1780000000,                  // unix seconds
  "response": [                               // answers, keyed by question order `o`
    { "q": 1, "a": 4 },                       // RATING → number 1..5
    { "q": 2, "a": ["Physics", "Maths"] },    // MULTI  → array of chosen option strings
    { "q": 3, "a": "Timing was tight." }      // TEXT   → string
  ]
}
```

- `response` MAY be a JSON **string** or an inline **array** — the FE parses
  both, but **inline array is preferred**.
- Each answer's `q` MUST equal the target question's `o`.
- When `anonymousSubmissionsAllowed=1` and the student opted to stay anonymous,
  omit `fk_id_registered_candidates`, `studentName`, `studentEmail`. The FE treats
  "no name" as anonymous and suppresses the candidate-profile link.

---

## 4. Read endpoints

### 4.1 Get survey — `GET /restricted/survey/{id}`
Returns the survey definition (questions + config). Drives the table columns and
tells the summary cards which question is RATING vs MULTI.
→ `{ "success": true, "data": Survey }`
Errors: `404 SURVEY_NOT_FOUND`.

### 4.2 List responses — `GET /restricted/survey/{id}/responses`
Paginated individual submissions for the table + CSV.

**Query params** (all optional except paging):
| Param | Type | Meaning |
|---|---|---|
| `page` | int | 1-based (default 1) |
| `size` | int | page size (default 20; allow up to 200 for export) |
| `q` | string | search by student name OR email |
| `candidateId` | int | filter to one respondent |
| `batchId` | string | filter to one batch |
| `dateFrom` | `YYYY-MM-DD` | submitted on/after (inclusive) |
| `dateTo` | `YYYY-MM-DD` | submitted on/before (inclusive) |

→
```jsonc
{
  "success": true,
  "data": [ Response, … ],
  "pagination": { "page": 1, "size": 20, "total": 143, "lastPage": 8 }
}
```
Notes:
- `total` / `lastPage` are required (the pager is server-driven).
- Sort newest first (`submittedAt DESC`).
- Anonymous responses still appear; just without identity fields.

### 4.3 Consolidated summary — `GET /restricted/survey/{id}/summary`  **(new)**
Server-side aggregation over **all matching responses** (not just one page), so
the dashboard cards are correct regardless of paging. Accepts the **same filter
params** as §4.2 (`q`, `batchId`, `candidateId`, `dateFrom`, `dateTo`) so the
summary tracks the active filters; ignores `page` / `size`.

→
```jsonc
{
  "success": true,
  "data": {
    "surveyId": 101,
    "totalResponses": 143,        // responses matching the filters
    "anonymousCount": 12,
    "identifiedCount": 131,
    "lastResponseAt": 1780500000, // unix seconds; null if none
    "questions": [
      {
        "o": 1,
        "t": "RATING",
        "answered": 140,          // responses that answered this question
        "average": 4.2,           // RATING only; 1 decimal; null if answered=0
        "distribution": { "1": 3, "2": 6, "3": 21, "4": 55, "5": 55 }  // RATING: star → count
      },
      {
        "o": 2,
        "t": "MULTI",
        "answered": 138,
        "totalSelections": 201,   // MULTI: sum of all option picks (multi-pick allowed)
        "options": [              // one entry per defined option, in `l` order
          { "label": "Physics",   "count": 88, "percent": 64 },   // percent of `answered`
          { "label": "Chemistry", "count": 61, "percent": 44 },
          { "label": "Maths",     "count": 52, "percent": 38 }
        ]
      },
      {
        "o": 3,
        "t": "TEXT",
        "answered": 73            // TEXT: count only; no aggregation
      }
    ]
  }
}
```

Aggregation rules (match the current client-side logic in `SurveyDashboardPage.jsx`):
- **RATING:** `average = sum(values 1..5) / answered`, rounded to 1 decimal;
  `distribution` keyed `"1".."5"`. Skip values ≤ 0 / non-numeric from both.
- **MULTI:** `count` = responses that selected that option; `percent =
  round(count / answered * 100)`. An option chosen by nobody still appears with
  `count:0`. `totalSelections` is the sum of `count` across options.
- **TEXT:** return `answered` only (no text rollup).
- A response that left a question blank does **not** count toward `answered`.

> FE follow-up: once §4.3 ships, `SurveyDashboardPage` should render cards from
> `summary.questions` instead of recomputing from `filteredResponses`.

---

## 5. Errors

| Code | HTTP | When |
|---|---|---|
| `SURVEY_NOT_FOUND` | 404 | unknown `{id}` |
| `VALIDATION_ERROR` | 422 | bad query params (e.g. `dateFrom > dateTo`); put per-field messages in `error.fields` |
| `FORBIDDEN` | 403 | caller lacks `surveys.view` (or `surveys.responses.export` for §6) |
| `SERVER_ERROR` | 500 | unexpected |

All in the `{ success:false, error:{ code, message, fields } }` envelope.

---

## 6. CSV export

The page currently builds the CSV in-browser from the loaded rows
(`handleDownloadCsv`). That only exports what's fetched. **Preferred BE option:**
add `GET /restricted/survey/{id}/responses/export` (same filters as §4.2, no
paging) gated by `surveys.responses.export`, returning `text/csv` with header:
`Date, Student_Name, Student_Email, Course_ID, Batch_ID, Is_Anonymous, Q1 … Qn`
(one column per question in `o` order; MULTI answers joined by `, `). If you'd
rather keep export client-side, just ensure §4.2 accepts a large `size` so the FE
can pull every page.

---

## 7. Existing write endpoints (unchanged — listed for context)

### 7.1 Create — `POST /restricted/survey/add`
Body is already schema-shaped by the FE (`questionsToSchema`):
```jsonc
{
  "title": "string (required)",
  "brief": "string|null",
  "surveyContent": [ { "o":1, "q":"…", "t":"RATING", "r":1 } ],
  "anonymousSubmissionsAllowed": 0,
  "multipleSubmissionsAllowed": 0,
  "audienceType": 1,
  "audienceBatchIds": ["b1","b2"],     // only when audienceType=1
  "closesAt": 1781200000               // null = open ended
}
```
→ `{ "success": true, "data": Survey }` · new surveys default `status=1` (ACTIVE).

### 7.2 Status change — `POST /restricted/survey/update-status`
`{ "id": 101, "status": 0|1|2 }` → `{ "success": true, "data": Survey }`.
`0` pause (`surveys.status.edit`), `1` resume (`surveys.status.edit`), `2` recall
(`surveys.recall`).

### 7.3 List surveys — `GET /restricted/survey/list`
Params `status`, `audienceType`, `q`, `page`, `size`, `sortBy=createdAt`,
`sortOrder=DESC`. → `{ "success": true, "data": [Survey…], "pagination": {…} }`.
Each row must include `responseCount` for the dashboard's Responses column.

---

## 8. Open questions for BE

1. **Multiple submissions:** when `multipleSubmissionsAllowed=1`, does
   `responseCount` / `totalResponses` count submissions or distinct respondents?
   FE currently shows the raw number — confirm which.
2. **Anonymous + filters:** can anonymous responses ever carry `batchId`
   (derived from the join token) so the batch filter still includes them, or are
   they always unbatched?
3. **`courseId` on responses:** the FE has a course filter applied client-side
   (`rsCourse`) and does **not** send it to §4.2. Either add a `courseId` query
   param to §4.2/§4.3, or confirm course filtering should stay client-side.
4. **Summary cost:** for large surveys, is §4.3 cheap enough to compute live per
   request, or should it be cached / materialized?
</content>
</invoke>
