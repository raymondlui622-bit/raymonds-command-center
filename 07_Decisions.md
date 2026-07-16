# Raymond Command Center - Decisions

## Initial Decisions

### 2026-07-16 - Existing outdated Command Center files were intentionally deleted
The former Raymond Command Center material should not be imported into this clean restart unless Raymond explicitly approves it later.

### 2026-07-16 - This is a clean project restart
The new project starts from the currently approved direction only.

### 2026-07-16 - The standard AI OS project binder will be used
The project will use the requested project-level binder structure:
- `01_CLAUDE.md`
- `02_INDEX.md`
- `03_BusinessDNA.md`
- `04_Blueprint.md`
- `05_Progress.md`
- `06_Todo.md`
- `07_Decisions.md`
- `08_Lessons.md`
- `09_MEMORY/`
- `10_DELIVERABLES/`

### 2026-07-16 - Brain Dump / To-Do and Review Later are the first approved modules
These two modules were the first approved modules during Phase 0.

### 2026-07-16 - The Morning Executive Brief will come later and consume information from supporting modules
The Morning Executive Brief should rely on supporting modules after those modules create trustworthy inputs.

### 2026-07-16 - No polished dashboard should be built before the information system works
The system should prioritize reliable capture, review, and organization before interface polish.

### 2026-07-16 - Capture should be fast and require minimal manual organization
The first modules should make it easy for Raymond to capture items quickly and organize them afterward.

## Product Discovery Decisions

### 2026-07-16 - The Command Center is product discovery only until PRD approval
No coding, database design, API design, technical architecture, or UI implementation should begin until Raymond explicitly approves the PRD.

### 2026-07-16 - The product should act like a Chief of Staff and COO
The Command Center should filter Raymond's world, prepare context, catch issues, and escalate only items that genuinely require Raymond.

### 2026-07-16 - Raymond is the final decision-maker, not the manual operator
AI should handle, prepare, organize, summarize, draft, research, monitor, or recommend when it can do so without making a high-risk decision.

### 2026-07-16 - Morning Executive Brief should use three layers
The layers are Requires Raymond, Needs Verification, and FYI.

### 2026-07-16 - Requires Raymond must stay clean
Only high-confidence items that genuinely need Raymond's decision, approval, judgment, relationship management, strategic direction, negotiation, or direct action should appear there.

### 2026-07-16 - Needs Verification is the uncertainty safety net
Uncertain items should not pollute Requires Raymond. Potentially important uncertain items should appear in Needs Verification with reasoning, missing context, source, suggested next step, and confidence.

### 2026-07-16 - FYI should never compete with operational work
News, research, saved resources, and informational updates belong below operational priorities unless they clearly require action.

### 2026-07-16 - Trust must be earned through transparency
Recommendations should include reasoning, confidence, evidence, and correction paths.

### 2026-07-16 - Preferred Version 1 scope is defined
Preferred Version 1 scope includes Universal Brain Dump / Quick Capture, Tasks and Follow-Ups, Review Later / Knowledge Queue, Projects on the Go, Get Back on Track summaries, Minimal My Arsenal, Minimal Prompt Library, and a read-only Morning Executive Brief.

### 2026-07-16 - Personal Intelligence Digest is deferred
Personal Intelligence Digest is a future backlog module, not MVP.

### 2026-07-16 - Phase 1 PRD is approved and frozen
Raymond approved Phase 1 with final revisions. The PRD is now the approved source of truth. The next phase is technical architecture, not additional product brainstorming.

### 2026-07-16 - Minimal My Arsenal remains in Version 1 with a strict boundary
Minimal My Arsenal remains in Version 1 only as a searchable inventory.

### 2026-07-16 - Minimal Prompt Library remains in Version 1 with a strict boundary
Minimal Prompt Library remains in Version 1 only as searchable with copy support.

### 2026-07-16 - Version 1 reads only from internal Command Center modules
Version 1 reads from Projects, Tasks, Review Later, and Brain Dump. It does not read external systems directly.

### 2026-07-16 - The Morning Executive Brief is AI-assisted
The Version 1 Morning Executive Brief is AI-assisted, not fully automated.

### 2026-07-16 - Requires Raymond has a normal item limit
Requires Raymond should normally contain no more than 7 items, with a target of 3-5.

### 2026-07-16 - Active Projects definition approved
Active Projects are only those currently being worked on, blocked, waiting for approval, waiting on another person, or due within 30 days.

## Technical Architecture Decisions

### 2026-07-16 - Phase 2 technical architecture proposal created
The proposal recommends a local-first web app for Version 1 with a simple frontend, small local backend, SQLite storage, SQLite full-text search, request-driven AI assistance, and Markdown/JSON exports.

### 2026-07-16 - External integrations remain out of Version 1
The architecture preserves the approved boundary that Version 1 reads only from internal Command Center modules: Projects, Tasks, Review Later, and Brain Dump.

### 2026-07-16 - Recommended source-of-truth split documented
The proposed split is: app database owns live operational records; the binder owns product, architecture, decisions, and governance; Markdown/JSON exports provide portability and recovery.

### 2026-07-16 - Phase 2 technical architecture approved
Raymond approved the local-first web app architecture: React frontend, small local backend, SQLite, SQLite full-text search, request-driven AI assistance, binder governance, Markdown/JSON exports, no cloud infrastructure, and no external integrations in Version 1.

## Data Model Decisions

### 2026-07-16 - Phase 2.5 data model proposal created and revised
The revised proposal defines 9 Version 1 record types: Raw Captures, Tasks, Review Later Resources, Projects, Project Updates, My Arsenal Items, Prompt Library Items, Morning Brief Items, and Classification Corrections.

### 2026-07-16 - Proposed source-of-truth owner for live records
The proposed owner for live operational records is the Command Center SQLite database. Binder files remain the source of truth for governance, product decisions, architecture, and approved documentation.

### 2026-07-16 - Follow-Ups removed as separate proposed Version 1 record type
The revised Phase 2.5 proposal uses Tasks as the single action and follow-up system. Waiting on Others is generated from tasks with `status = waiting`.

### 2026-07-16 - Phase 2.5 data model approved and frozen
Raymond approved the revised Phase 2.5 data model. It is now the implementation source of truth. No further architectural refinements should be made unless implementation reveals a genuine issue.

## Implementation Planning Decisions

### 2026-07-16 - Phase 3 starts with implementation planning, not building
Phase 3 begins with an implementation roadmap. The first implementation milestone should build only the local app foundation and no product features.

### 2026-07-16 - Phase 3 Implementation Plan approved and frozen
Raymond approved the Phase 3 Implementation Plan with revisions. Exports move after the first functional modules, database structures are added module-by-module, Milestone 1 remains infrastructure only, and every milestone requires a git commit, summary, rollback instructions, and manual test results.

### 2026-07-16 - Milestone Verification Gate is a standing project rule
A milestone is not complete until it has clean git status, successful local startup, completed manual tests, regression check, binder updates, git commit, verified rollback instructions, short implementation summary, and recommendation to proceed or stop.

### 2026-07-16 - Milestone 1 approved to begin
Raymond approved Milestone 1 - Local App Foundation. The milestone must remain infrastructure only and must not include navigation, layouts, dashboards, styling, feature UI, AI behavior, or product modules.

### 2026-07-16 - Milestone 1 completed as infrastructure only
Milestone 1 created a minimal React frontend, local Node backend, health endpoint, SQLite connection check, and local run instructions. No feature UI, navigation, layouts, dashboards, AI behavior, or product modules were added.

### 2026-07-16 - Local git repository initialized
The project folder did not already contain a git repository. A local git repository was initialized so milestones can satisfy the approved verification gate.

### 2026-07-16 - Milestone 2 approved to begin
Raymond approved Milestone 2 - Raw Capture Data Slice. The milestone must remain limited to Raw Capture schema, backend data access, fixtures, and data-layer tests.

### 2026-07-16 - Milestone 2 completed as a Raw Capture data slice only
Milestone 2 added the `raw_captures` SQLite table, approved Raw Capture statuses, create/read data access functions, a fixture, and data-layer tests. No feature UI, backend routes, AI classification, exports, or future module tables were added.

### 2026-07-16 - Milestone 3 approved to begin
Raymond approved Milestone 3 - Raw Capture Feature. The milestone must remain limited to making Raw Capture usable, with no future milestone work, UI polish, AI, exports, or additional frameworks.

### 2026-07-16 - Raw Capture required-string whitespace trimming deferred
Raymond identified a minor backlog item to trim whitespace for required string fields before storing them. This should not be implemented unless it naturally fits a future milestone.

### 2026-07-16 - Milestone 3 completed as the first usable Raw Capture module
Milestone 3 added Raw Capture backend handlers and a minimal frontend view for adding, viewing, and archiving captures. Archived captures remain retrievable. No AI classification, exports, future module tables, or new dependencies were added.

### 2026-07-16 - Milestone 4 approved to begin
Raymond approved Milestone 4 - Tasks and Waiting Tasks. The milestone must remain limited to Tasks as the single action, reminder, waiting, and follow-up system.

### 2026-07-16 - Additional Raw Capture refinements deferred to backlog
Raymond identified three future backlog items: trim leading/trailing whitespace before storing required string fields, return HTTP 400 for malformed JSON bodies instead of allowing JSON.parse errors to propagate, and restore keyboard focus to the capture textarea after saving. These should not be implemented unless they naturally fit a later milestone.

### 2026-07-16 - Milestone 4 completed with Tasks as the follow-up system
Milestone 4 added the `tasks` SQLite table, approved Task statuses, waiting-task fields, task data access, task backend handlers, a minimal frontend view, and tests. Waiting and follow-up behavior is represented by Tasks with `status = waiting`; no separate Follow-Up table or feature was created.

### 2026-07-16 - Milestone 5 approved to begin
Raymond approved Milestone 5 - Review Later Resources. The milestone must remain limited to Review Later Resources, with no Projects, Search, Morning Brief, AI, exports, UI polish, additional frameworks, or future module work.

### 2026-07-16 - Waiting-task validation deferred to backlog
Raymond identified a future backlog item to consider validating waiting-task fields, such as requiring `waiting_on` when `status = waiting`. This should not be implemented until a later milestone naturally calls for it.

### 2026-07-16 - Milestone 5 completed as the Review Later resource slice
Milestone 5 added the `review_later_resources` SQLite table, approved Review Later statuses, resource data access, resource backend handlers, a minimal frontend view, and tests. Resources can preserve title, type, URL/location, why it matters, possible use, tags, notes, and one future primary project link. Archived resources remain retrievable.

### 2026-07-16 - Milestone 6 approved to begin
Raymond approved Milestone 6 - Projects and Project Updates. The milestone must remain limited to Projects and append-only Project Updates, with no Search, Morning Brief, AI, exports, UI polish, additional frameworks, or future module work.

### 2026-07-16 - Malformed JSON and tag structure refinements deferred
Raymond identified future backlog items to handle malformed JSON consistently across every API endpoint with HTTP 400 responses and to keep tags as a simple string until search requirements justify a more complex structure. These should not be implemented until a later milestone naturally calls for them.

### 2026-07-16 - Milestone 6 completed with append-only Project Updates
Milestone 6 added the `projects` and `project_updates` SQLite tables, approved Project statuses, Project data access, Project Update append-only creation/listing, Project backend handlers, a minimal frontend view, and tests. `due_soon` is calculated rather than stored, `active_reason` is stored, and Tasks/Review Later resources can link to one primary project.
