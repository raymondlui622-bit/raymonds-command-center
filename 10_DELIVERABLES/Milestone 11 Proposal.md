# Milestone 11 Proposal - Get Back on Track Summaries

Status: Awaiting approval. Do not implement until Raymond approves.
Date: 2026-07-17

## Source of Truth
This proposal implements Milestone 11 exactly as scoped in `Phase 3 Implementation Plan.md`:

> Generate project resume summaries from internal project data only.
> Sources: Project, Project Updates, open Tasks, waiting Tasks, blockers, and next action.
> Summary is generated on request. Summary does not overwrite project history. Raymond can refresh summary manually.

Kept as one milestone per Raymond's direction (not split into 11a/11b).

## Problem
Projects already store `last_completed_step`, `current_blocker`, `next_action`, `waiting_on`, plus append-only `project_updates` and linked `tasks` (open/waiting via `related_project_id`). Nothing assembles these into a single resume view. Raymond has to reconstruct "where did I leave off" manually across project fields, updates history, and task lists.

## User-Facing Outcome
On a project's detail view, Raymond can request a Get Back on Track summary and see, within 30 seconds of reading:
- Last completed step, current blocker, next action, waiting-on (deterministic, from project fields)
- Related open and waiting tasks for that project (deterministic, from tasks table)
- Recent project updates (deterministic, most recent N)
- One short AI-written narrative paragraph synthesizing the above, when a provider is configured

The deterministic parts always work with no API key. The narrative is additive, generated on request, and manually refreshable - it never overwrites or is stored as project history.

## Scope
- One request-driven endpoint: `POST /projects/:id/resume-summary`
  - Request-driven (not passive GET) to match "generated on request... refreshed manually."
  - Rejects non-active projects (completed/archived) with a clear error.
  - Always assembles and returns the deterministic bundle: project fields, open+waiting tasks where `related_project_id` matches, most recent 3 `project_updates`.
  - If `OPENAI_API_KEY` configured: additionally calls the existing classification provider boundary pattern with a new request type to get a short narrative synthesis. Same env vars (`RCC_AI_CLASSIFICATION_MODEL`, `RCC_AI_CLASSIFICATION_TIMEOUT_MS`), same error classes (`ClassificationProviderUnavailableError`, `ClassificationProviderError`) from `classificationService.js`.
  - If provider unavailable or errors: response still returns 200 with the deterministic bundle; `narrative: null` and a `narrative_status` field (`"unavailable"` or `"error"`) instead of failing the request.
  - No database writes of any kind occur from this endpoint - not the narrative, not a "last generated" timestamp, nothing test-observable as a mutation.
- Frontend: a "Get Back on Track" section on the project detail view with a manual refresh action calling the endpoint; deterministic fields render immediately, narrative renders if present, silently omitted otherwise.

## Out of Scope
- Milestone 12 Morning Brief (separate module).
- Any module besides Projects/Tasks/Project Updates as input sources.
- Storing or versioning generated narratives.
- Multi-provider support, provider selection UI, new dependencies.
- Cross-project prioritization, ranking, or aggregation.
- Live OpenAI verification - bundled into the single Version-1-end smoke test covering Milestone 10.1, 11, and 12 together, per Raymond's direction.

## Files Likely to Change
- `backend/classificationService.js` - add a resume-summary request function reusing the existing provider plumbing (or extract shared provider-call internals if reuse gets awkward; call this out explicitly if it happens rather than doing it silently).
- `backend/projectHandlers.js` - new route match + handler for `POST /projects/:id/resume-summary`.
- New test file, e.g. `backend/projectResumeSummary.test.js` - mocked deterministic provider tests.
- `backend/projectHandlers.test.js` - route-level tests (missing key, mocked success, mocked failure, no mutation, archived/completed rejection).
- `src/` - project detail view: new section + manual refresh button (exact file found at implementation time).
- `05_Progress.md`, `06_Todo.md`, `07_Decisions.md`, `08_Lessons.md`.
- New `10_DELIVERABLES/Milestone 11 Verification.md` at completion.

## Tests Required
- Deterministic bundle (fields + tasks + updates) correct with no key set; no provider call attempted.
- Deterministic bundle correct and unaffected regardless of provider outcome.
- Mocked provider success: narrative present, values otherwise unchanged.
- Mocked provider timeout/4xx/5xx/malformed output: `narrative: null`, `narrative_status: "error"`, request still 200, no throw.
- Missing key: `narrative: null`, `narrative_status: "unavailable"`, request still 200.
- No database writes occur under any condition (assert row counts unchanged across all tables touched).
- Completed/archived projects rejected with clear error, no summary attempted.
- Open and waiting tasks scoped correctly to `related_project_id` (no cross-project leakage).
- Full regression: `npm test` stays green.

## Main Risks
- Reusing `classificationService.js` for a second request shape couples two features in one file; acceptable now, but if that file grows unwieldy this is a legitimate reason to split it later - not scope creep, a maintenance call to flag when it happens.
- "Generated on request, refreshed manually" implies no caching/storage - confirming no hidden persistence layer gets added for convenience (e.g., no memoizing narrative in the projects table).
- Live OpenAI path ships code-complete but verification-pending, same as Milestone 10.1, until the bundled end-of-Version-1 smoke test - this needs to stay visible in Milestone 11's own verification doc, not just Milestone 10.1's.

## Smallest Practical Implementation
Both parts (deterministic bundle + optional AI narrative) in one milestone, one endpoint, one response shape - the AI narrative is just an additional optional field on the same response, not a separate call or separate milestone. No caching layer, no new tables, no new dependencies. Reuses the Milestone 10 provider boundary pattern rather than building a second one.

## Rollback Strategy
Remove the resume-summary endpoint and frontend section; project data and tasks remain untouched since nothing here mutates them.

## Estimated Complexity
Medium to High (per Phase 3 Implementation Plan).
