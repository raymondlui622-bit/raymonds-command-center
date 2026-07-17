# Milestone 12 Proposal - Read-Only AI-Assisted Morning Brief (Revised)

Status: Awaiting approval. Do not implement until Raymond approves.
Date: 2026-07-17
Starting checkpoint: commit `a60307aed9a57fb2c39dfe717d9ac82f8a481806`

Persisted, request-driven Morning Brief per the frozen `Phase 2.5 Data Model` and `Phase 3 Implementation Plan`. "Read-only" describes source records only - the Morning Brief itself is persisted so Raymond can review, approve, dismiss, and correct it later.

## Summary of This Revision
Three changes from the prior draft, all requested by Raymond:
1. A real batch identifier (`brief_batch_id`, a `randomUUID()`) replaces `generated_at` as the grouping/identity key. `generated_at` stays, but only for display and ordering.
2. `confidence` stays in the schema for frozen-model compatibility but is explicitly inert in Milestone 12 - always `1.0`, never read by any ranking/filtering/placement/display logic.
3. The importance-downgrade-after-7 rule is removed. `importance` now always describes the item itself, never its position in a list. The "3-5 target, 7 soft cap" display rule moves entirely to the frontend - it shows/hides, it never changes what's stored.

## Batch Grouping: `brief_batch_id`
`brief_batch_id` is generated once via `randomUUID()` per `POST /morning-brief` request, before the insert loop, and assigned identically to every item that generation call creates. It is a random, collision-proof identity value - not derived from time, so the same-millisecond concern from the prior revision no longer applies at all. `generated_at` (`new Date().toISOString()`, also computed once per request for consistency) is stored alongside it purely for showing "generated at 9:03am" and for `ORDER BY` in history listings - never used in a `WHERE` clause to find "the items belonging to this batch." Every grouping query (`GET /morning-brief/latest`, `GET /morning-brief/history`) filters and groups by `brief_batch_id`.

## `confidence`: Present, Inert
The frozen model requires `confidence` as a field. Milestone 12 populates it with a fixed `1.0` on every deterministic item and does nothing else with it:
- not used to rank items within a section
- not used to filter which items appear
- not used to decide section placement
- not used to decide display priority or ordering
- no confidence-scoring logic, thresholds, or AI-derived confidence added in this milestone

It exists so the column is schema-complete against the frozen model and so a future milestone that does want real confidence scoring (e.g., from AI) has a field ready to use without a new migration. Milestone 12 itself never reads the value it writes.

## Importance: Describes the Item, Not Its Position
`importance` is assigned once, at generation, from a fixed per-section deterministic mapping - the same mapping for every item in that section, regardless of how many items are in the section or where the item ranks within it:

| Section | `importance` |
|---|---|
| `requires_raymond` | `high` |
| `needs_verification` | `medium` |
| `waiting_on_others` | `medium` |
| `fyi` | `low` |

This is a section-level rule, not an item-level judgment (Milestone 12 has no per-item risk/urgency scoring - that would be the AI-driven judgment Raymond has already ruled out). All items matching the Requires Raymond deterministic rule are stored with `importance = "high"` and are all returned by the API - none are hidden, dropped, reclassified, or downgraded because of count.

## Seven-Item Display Rule: Frontend Only
The backend and the database are unaware of any cap. `POST /morning-brief`, `GET /morning-brief/latest`, and `GET /morning-brief/history` always return every item that matched a section's deterministic rule, in full. `src/main.jsx`'s Morning Brief view shows the first 7 Requires Raymond items by default (sorted newest-created-first, matching the section's existing sort) with an "Show N more" expand control revealing the rest. This is pure client-side `slice()`/toggle-state - no data is ever excluded from what the API returns or what gets persisted.

## Persisted Table - Final Schema

```sql
CREATE TABLE morning_brief_items (
  id               TEXT PRIMARY KEY,
  brief_batch_id   TEXT NOT NULL,
  brief_date       TEXT NOT NULL,
  generated_at     TEXT NOT NULL,
  section          TEXT NOT NULL
    CHECK (section IN ('requires_raymond', 'needs_verification', 'waiting_on_others', 'fyi')),
  title            TEXT NOT NULL,
  summary          TEXT NOT NULL,
  reason           TEXT NOT NULL,
  confidence       REAL NOT NULL,
  importance       TEXT NOT NULL
    CHECK (importance IN ('high', 'medium', 'low')),
  source_refs      TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  ai_narrative     TEXT,
  review_status    TEXT NOT NULL DEFAULT 'proposed'
    CHECK (review_status IN ('proposed', 'accepted', 'corrected', 'dismissed', 'resolved')),
  corrected_note   TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
)
```

| Column | Type | Required | Default | Allowed values | Origin |
|---|---|---|---|---|---|
| `id` | TEXT (PK) | yes | app-generated (`randomUUID`) | any unique string | Frozen (Phase 2.5 #8) |
| `brief_date` | TEXT | yes | none | `YYYY-MM-DD` | Frozen |
| `section` | TEXT | yes | none | `requires_raymond`, `needs_verification`, `waiting_on_others`, `fyi` | Frozen |
| `title` | TEXT | yes | none | free text | Frozen |
| `summary` | TEXT | yes | none | free text | Frozen |
| `reason` | TEXT | yes | none | free text, deterministic rule-generated | Frozen |
| `confidence` | REAL | yes | none | always `1.0` in Milestone 12; inert (see above) | Frozen |
| `importance` | TEXT | yes | none | `high`, `medium`, `low`, fixed per section (see table above); enum itself is this milestone's own addition - frozen model requires the field but doesn't enumerate it | Frozen field / **new enum** |
| `source_refs` | TEXT (JSON) | yes | none | JSON array of `{ "record_type": ..., "id": ... }`; `record_type` in `task`, `project`, `raw_capture`, `review_later_resource` | Frozen |
| `suggested_action` | TEXT | yes | none | free text, deterministic template per section | Frozen |
| `review_status` | TEXT | yes | `'proposed'` | `proposed`, `accepted`, `corrected`, `dismissed`, `resolved` | Frozen |
| `created_at` | TEXT | yes | `datetime('now')` | ISO timestamp | Frozen |
| `brief_batch_id` | TEXT | yes | none (`randomUUID()`, once per request) | any UUID | **New** - batch identity/grouping key |
| `generated_at` | TEXT | yes | none (once per request) | ISO timestamp | **New** - display/ordering only, not identity |
| `ai_narrative` | TEXT | no (nullable) | `NULL` | free text or `NULL` | **New** - keeps `reason` AI-independent |
| `corrected_note` | TEXT | no (nullable) | `NULL` | free text or `NULL` | **New** - correction annotation |

12 columns from the frozen Phase 2.5 field list, unchanged in name and intent. **4 new columns**: `brief_batch_id`, `generated_at`, `ai_narrative`, `corrected_note`. `corrected_section` and `reviewed_at` from earlier drafts remain removed (per the prior revision's justification).

`source_type`: no standalone column. Equivalent is `record_type` inside each `source_refs` entry: `task`, `project`, `raw_capture`, `review_later_resource`.

## Generation Endpoint

`POST /morning-brief`

```json
// Response (200)
{
  "brief_batch_id": "7f3a...-uuid",
  "generated_at": "2026-07-17T14:00:00.000Z",
  "brief_date": "2026-07-17",
  "ai_status": "unavailable",
  "items": {
    "requires_raymond": [
      {
        "id": "...", "title": "...", "summary": "...", "reason": "...",
        "confidence": 1.0, "importance": "high",
        "source_refs": [{ "record_type": "task", "id": "..." }],
        "suggested_action": "...", "ai_narrative": null,
        "review_status": "proposed", "corrected_note": null
      }
    ],
    "needs_verification": [ "..." ],
    "waiting_on_others": [ "..." ],
    "fyi": [ "..." ]
  }
}
```

All matching items are returned in full - `requires_raymond` is not truncated to 7 here; that cap is a frontend display choice only (see above). `ai_status` is computed live and returned only in this response, not persisted (unchanged from the prior revision).

## Review/Correction Endpoints

`GET /morning-brief/latest` - all items where `brief_batch_id` equals the batch with the maximum `generated_at`, grouped by section.

`GET /morning-brief/history` - batch metadata, grouped and identified by `brief_batch_id`, ordered by `generated_at` descending:
```json
{
  "batches": [
    {
      "brief_batch_id": "7f3a...-uuid",
      "generated_at": "2026-07-17T14:00:00.000Z",
      "brief_date": "2026-07-17",
      "counts": { "requires_raymond": 9, "needs_verification": 1, "waiting_on_others": 2, "fyi": 4 }
    }
  ]
}
```
(`requires_raymond: 9` above illustrates that history counts reflect everything matched and stored, not the frontend's 7-item default view.)

`PATCH /morning-brief-items/:id` - unchanged from the prior revision:
```json
{ "review_status": "accepted" | "dismissed" | "corrected", "section": "...", "corrected_note": "..." }
```
`review_status` required, one of `accepted`/`dismissed`/`corrected`. `section` required only when `corrected`. `corrected_note` always optional. Only `section` (if corrected), `review_status`, `corrected_note` ever change after insert.

## Exact Deterministic Selection Rules
Unchanged from the prior revision:
- **Requires Raymond**: Tasks with `status` in (`open`, `in_progress`, `blocked`) and `requires_raymond = 1`; Projects with `status` in (`active`, `blocked`, `waiting`, `paused`) and `requires_raymond = 1`. Sorted newest-created first. All matches stored and returned - no count-based exclusion or downgrade.
- **Waiting on Others**: Tasks with `status = "waiting"`.
- **FYI**: Review Later Resources with `status` in (`new`, `reviewing`, `useful`, `reference`).
- **Needs Verification**: Raw Captures with `status` in (`new`, `proposed`) AND (`related_project_id IS NULL` OR `suggested_type IS NULL`).

**Honest limitation, unchanged:** no current field encodes legal, financial, or deadline risk. This section is a missing-data proxy, not a risk detector - stated in the Milestone 12 Verification doc when this ships.

## AI's Limited Role
Unchanged: one request per generation, given only the finished deterministic item set. May only populate `ai_narrative`. No path back into section, status, confidence, or importance.

## No-Key Behavior
Unchanged: deterministic items fully computed and persisted with no `OPENAI_API_KEY`; `ai_status: "unavailable"`; every `ai_narrative` is `NULL`.

## Duplicate-Generation Behavior
Every `POST /morning-brief` call creates a new batch (`brief_batch_id` is a fresh `randomUUID()` every time - no collision possible regardless of timing). No deduplication, no merge, no overwrite.

## Retention/History Behavior
All batches retained indefinitely by default. `GET /morning-brief/history` lists every `brief_batch_id` seen, newest `generated_at` first. No automatic pruning, no hard delete in this milestone.

## Scope
- One migration adding `morning_brief_items`.
- Deterministic four-section assembly from Tasks, Projects, Raw Captures, Review Later Resources, with fixed per-section `importance`.
- Optional single AI narrative-enrichment call, reusing Milestone 10.1/11 OpenAI provider plumbing.
- Generation, latest-read, history-read, and review-status update (accept/dismiss/correct) - all scoped to the new table only.
- Frontend: Morning Brief view, manual Generate action, section display, per-item accept/dismiss/correct controls, client-side 7-item cap with expand for Requires Raymond.

## Out of Scope
- Automatic scheduling, notifications, email delivery, external integrations.
- AI-driven section placement, legal/financial/deadline risk judgment, AI-derived confidence.
- Any server-side truncation, downgrading, or reclassification of items based on count or position.
- Any write path from a Morning Brief Item back into a source record.
- Deduplication/suppression of redundant same-day generations.
- `reviewed_at`, `corrected_section`, historical persisted `ai_status`, a parent "Morning Briefs" table - not included in V1.
- Milestone 13 stabilization/QA work.
- Live OpenAI verification (deferred, see below).

## Files Likely to Change
- New `backend/migrations/morningBriefItems.js`
- `backend/db.js` - wire the new migration
- New `backend/morningBriefItems.js` - bulk insert a batch (all rows sharing one `brief_batch_id`/`generated_at`), get latest batch by `brief_batch_id`, list history metadata, get/update one item
- New `backend/morningBriefService.js` - deterministic section-assembly functions (fixed importance per section) + optional AI enrichment, reusing `classificationService.js` provider plumbing
- New `backend/morningBriefHandlers.js` - generate/latest/history/patch routes
- `backend/server.js` - wire the new handler
- New test files: `backend/morningBriefItems.test.js`, `backend/morningBriefService.test.js`, `backend/morningBriefHandlers.test.js`
- `src/main.jsx` - Morning Brief view, including the client-side 7-item expand control
- `05_Progress.md`, `06_Todo.md`, `07_Decisions.md`, `08_Lessons.md`, new `10_DELIVERABLES/Milestone 12 Verification.md`

## Migrations Required
One: `morning_brief_items` as specified above. No changes to any existing table.

## Tests Required
- Each section's deterministic rule, including exclusions.
- Requires Raymond: 9+ matching items all stored and returned with `importance = "high"` uniformly - none downgraded, none dropped, count has no effect on stored fields.
- `confidence` is `1.0` on every generated item; no test or code path filters/sorts/gates on it.
- `importance` matches the fixed per-section table above regardless of section size.
- Needs Verification produces the narrower missing-data set only.
- No key: full batch persisted, `ai_status: "unavailable"`, no fetch attempted.
- Mocked AI success: `ai_narrative` populated, deterministic fields/counts unchanged.
- Mocked AI timeout/4xx/5xx/malformed output: `ai_status: "error"`, batch still persisted, HTTP 200.
- Two generations produce two distinct `brief_batch_id` values (both `randomUUID()`, asserted different) - including a same-millisecond scenario, since identity no longer depends on timing at all.
- `GET /morning-brief/latest` returns only the batch matching the newest `generated_at`, filtered by its `brief_batch_id`.
- `GET /morning-brief/history` returns metadata grouped by `brief_batch_id`.
- `PATCH .../morning-brief-items/:id`: accept/dismiss/correct each update only `review_status`/`section`/`corrected_note`; invalid `review_status` rejected; `section` required only for `corrected`.
- No-mutation test across all seven source tables for generate, read, and patch calls.
- AI request body contains only the four sections' `title`/`summary`/`reason`/`source_refs` - nothing else.
- Full regression: `npm test` stays green.

## Risks
- First milestone since 10.1/11 to add a table/migration - see Rollback below.
- `importance` enum (`high`/`medium`/`low`) and its fixed per-section mapping are this milestone's own design choice, not specified by the frozen model - flagged rather than presented as pre-approved.
- Needs Verification's honest gap (no risk detection) belongs in the shipped verification doc.
- `PATCH` is a genuine new write path (scoped to the new table only) - needs standard input validation: reject `review_status` outside the 3 allowed values, ignore/reject client-supplied `id`/`brief_batch_id`/`generated_at`/deterministic fields.
- Returning all Requires Raymond items unfiltered means a very large backlog (many tasks/projects flagged `requires_raymond = 1`) produces a large API response and a long frontend list under the expand control - acceptable for Version 1's expected scale, worth a note if Raymond's actual `requires_raymond` volume turns out to be large in practice.

## Smallest Practical Implementation
One table (16 columns: 12 frozen + 4 new), one migration, 3 read/generate endpoints + 1 patch endpoint, 4 deterministic section-builder functions with fixed per-section importance, 1 optional AI call reusing existing provider plumbing, 1 client-side expand toggle for the 7-item default view. No parent Brief table, no `corrected_section`, no `reviewed_at`, no persisted historical `ai_status`, no server-side truncation/downgrading, no deduplication, no scheduling, no write-back to source records, no new dependencies.

## Live OpenAI Verification
Deferred to the single bundled Version 1 smoke test covering classification, project summaries, and the Morning Brief together, same as Milestone 10.1 and 11. Ships code-complete with mocked-provider tests only.

## Rollback Strategy
Remove the Morning Brief endpoints and frontend view; drop `morning_brief_items` via a follow-up migration only if no real review history exists in it yet. Once real data exists, rollback means "stop generating new briefs," not "delete the table."

## Estimated Complexity
High (per Phase 3 Implementation Plan).
