# Contract Change — Messenger Campaign Personalization

**Endpoint:** `POST {{base_url_v2}}/restricted/messenger/campaigns`
**Status:** Draft / proposed
**Owner (FE):** Messenger module
**Backwards compatible:** Yes — fields are additive; campaigns without personalization continue to work unchanged.

---

## 1. Motivation

The composer in `/messenger` already supports `{{token}}` syntax in `title` and `message`. Today the BE only resolves static values supplied under `metadata.variables`. We need per-recipient resolution: a campaign author maps each token to a field on the recipient's candidate profile (with an optional fallback for empty/null values), and the BE substitutes per recipient at dispatch time.

The candidate profile shape the FE selects from is the response of:

```
GET {{base_url_v2}}/restricted/people/candidate/profile?id={candidate_id}
→ { "status": "success", "data": { name, email, place, fatherName, … } }
```

---

## 2. New request field — `metadata.personalization`

A new object on the existing `metadata` blob.

```jsonc
{
  "title": "Hi {{name}}, your exam starts at {{exam_time}}",
  "message": "Hello {{name}}, mock test for {{course}} begins at {{exam_time}}.",
  "type": "broadcast",
  "channels": ["email", "in_app"],
  "audience_filter": { "role": "student", "status": 1 },
  "metadata": {
    "personalization": {
      "name":      { "field": "name",       "default": "Student" },
      "course":    { "field": "classText",  "default": "your course" },
      "exam_time": { "static": "2026-05-30 10:00 IST" }
    }
  }
}
```

### 2.1 Schema

```
metadata.personalization : object<string, MappingEntry>   // optional

MappingEntry (one of):
  { "field":  <candidate_field_key: string>,  "default"?: <string> }   // per-recipient
  { "static": <string> }                                                // same value for all
```

### 2.2 Keys

* The **object keys** are the placeholder names exactly as they appear inside `{{…}}` in `title` / `message` (no braces, no whitespace).
* Allowed pattern: `^[A-Za-z0-9_]+$`. Reject others with `422`.
* If the same placeholder appears in both `title` and `message`, **one** mapping covers both.

### 2.3 `field`

* Must be a key present in the `data` object returned by `GET /restricted/people/candidate/profile`.
* Whitelist (read from `CandidateProfileResource` / equivalent):
  `name, registeredMobile, communicationMobile, email, place, fatherName, motherName,
   about, dob, yearOfPassing, lastInstitution, genderText, aspirationText, classText, boardText, candidateKey`
* Reject any other value with `422`. **Never** allow free-form dotted paths or expressions — this is a hard injection boundary.

### 2.4 `default`

* String, optional. Empty string is allowed and means "substitute nothing".
* Used when the resolved field value is `null`, `""`, or missing for that recipient.
* Max length: 200 chars.

### 2.5 `static`

* For campaign-wide values (event time, course launch date) that don't vary per recipient.
* Mutually exclusive with `field` / `default`. If both forms are present in a single entry, reject `422`.

---

## 3. Validation rules (request time)

Return `422` with the standard Laravel envelope:

| Condition | `errors` key | Message (suggested) |
|---|---|---|
| `title` / `message` contains `{{token}}` not present in `metadata.personalization` | `metadata.personalization.<token>` | "Placeholder {{<token>}} is used but not mapped." |
| `metadata.personalization` key not referenced in `title` / `message` | `metadata.personalization.<token>` | "Mapping for {{<token>}} is unused." (warn-level — see §6) |
| `field` not in the candidate whitelist | `metadata.personalization.<token>.field` | "Unknown candidate field." |
| Both `field` and `static` set | `metadata.personalization.<token>` | "Set either `field` or `static`, not both." |
| `default` longer than 200 chars | `metadata.personalization.<token>.default` | "Default value is too long." |
| Placeholder name fails `^[A-Za-z0-9_]+$` | `metadata.personalization` | "Invalid placeholder name." |

The first two checks tie the request to the actual template content — this is what unblocks the FE's "Send disabled while unmapped" guard.

---

## 4. Resolution semantics (dispatch time)

For each recipient resolved from `audience_filter`:

1. Load the candidate profile (single query, cached per recipient for the campaign run).
2. For each placeholder `P` referenced in `title` or `message`:
   * If `personalization[P].static` is set → use the static string.
   * Else read `candidate.data[personalization[P].field]`.
     * If the value is `null`, empty string, or the key is absent → use `personalization[P].default ?? ""`.
     * Otherwise stringify the value (numbers / booleans → their string form; dates → ISO `YYYY-MM-DD`).
3. Substitute every literal occurrence of `{{P}}` (allowing `{{ P }}` with surrounding whitespace) in both `title` and `message`.
4. Apply the result to all enabled channels (`email`, `sms`, `whatsapp`, `in_app`).

**Escaping.** Substitution is plain text, not templating: do not evaluate further `{{ }}` produced by substitution (no recursive expansion). HTML-escape for email and in-app rendering as you do today — personalization values must travel through the same escape path as the rest of the body.

**Channel-specific overrides.** WhatsApp templates that have variable slots (`metadata.provider_options.whatsapp.template_name`) continue to use their own positional parameters; `personalization` does **not** rewrite those. If WhatsApp is the only enabled channel and the campaign is template-mode, ignore `personalization` for that channel but still apply it to other channels.

---

## 5. Recipient row metadata (analytics)

For each `notification_campaign_recipients` row, persist the **resolved** title/message snapshot (or at least the substituted values) so the in-app inbox shows the exact text the user received. Suggested column: `resolved_payload` JSON, or two columns `resolved_title` / `resolved_message`. This also keeps `read` events meaningful and lets support reproduce what a user saw.

Recipient list endpoint (`GET /campaigns/{uuid}/recipients`) should include `resolved_title` and `resolved_message` per row so QA can spot-check substitution outcomes.

---

## 6. Soft-fail / hard-fail policy

The FE blocks send when placeholders are unmapped, so the create call should rarely see this. But for safety:

* **Hard fail (422 at create):** unmapped placeholder, unknown field, schema violations.
* **Soft fail (per-recipient at dispatch):** if the candidate row is missing entirely (deleted between create and dispatch) — mark that recipient `failed` with `error_code = personalization_lookup_failed`, do **not** abort the campaign.
* **Warn (non-blocking):** mapping entries that aren't referenced in title/message. Return them in the 201 response under `meta.warnings[]` so the FE can surface them, but do not reject.

---

## 7. Example — full create payload

```bash
curl --location --request POST "{{base_url_v2}}/restricted/messenger/campaigns" \
  --header "Authorization: Bearer {{admin_token}}" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Hi {{name}}, your mock test starts at {{exam_time}}",
    "message": "Hello {{name}} from {{place}}. Your test for {{course}} begins at {{exam_time}}. Best of luck!",
    "type": "broadcast",
    "channels": ["email", "in_app", "sms"],
    "audience_filter": { "role": "student", "status": 1 },
    "metadata": {
      "notify_parents": false,
      "personalization": {
        "name":      { "field": "name",      "default": "Student" },
        "place":     { "field": "place",     "default": "your city" },
        "course":    { "field": "classText", "default": "your course" },
        "exam_time": { "static": "2026-05-30 10:00 IST" }
      }
    }
  }'
```

For a recipient whose profile is `{ "name": "Amith C S", "place": "Malappuram", "classText": "" }`, the resolved email body should read:

> Hello Amith C S from Malappuram. Your test for your course begins at 2026-05-30 10:00 IST. Best of luck!

---

## 8. Out of scope (for this contract)

* Conditional templates (`{{#if}}` / `{{else}}`)
* Nested field paths (`address.city`)
* Locale-aware formatting (date / number / currency)
* Per-recipient channel selection

These can be addressed in follow-ups; the current shape leaves room for them (e.g., `MappingEntry` can grow a `format` key without breaking existing callers).

---

## 9. FE → BE checklist

- [ ] Validator on `messenger.campaign.create` recognises `metadata.personalization`.
- [ ] Whitelist of candidate fields shared with FE (consider exposing via `GET /restricted/messenger/personalization-fields` so the FE doesn't hard-code keys).
- [ ] Dispatcher resolves placeholders per recipient and writes `resolved_title` / `resolved_message`.
- [ ] Analytics + recipient endpoints expose resolved values.
- [ ] Unit tests: unmapped token, unknown field, both `field`+`static`, missing candidate row at dispatch, integer field → string coercion, default applied on null/empty.
