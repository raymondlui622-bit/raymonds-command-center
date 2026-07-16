# Raymond Command Center - Phase 2 Technical Architecture Proposal

Status: Approved
Date: 2026-07-16
Source of truth: `10_DELIVERABLES/Phase 1 Approved PRD.md`

## 1. Recommended Application Type
Recommended architecture: local-first web app with portable file exports.

Plain English explanation:
Raymond should use the Command Center in a browser, but the app should run locally on his own machine first. This gives the clean experience of a web app without requiring cloud infrastructure, accounts, collaboration, or complex deployment.

The app should not be Obsidian-only. Obsidian is excellent for reading and editing Markdown, but Version 1 needs structured records, filters, status changes, copy buttons, search, brief assembly, and correction history. Those are easier and safer in a small local app.

The app should not be a desktop app first. A desktop wrapper adds packaging complexity before the product has proven itself. A desktop wrapper can be added later if the local web app becomes useful.

Final recommendation:
- Build a local web app first.
- Keep data local.
- Export readable Markdown and JSON.
- Consider a desktop wrapper later only if it reduces friction.

## 2. Recommended Technology Stack
### Frontend
Recommendation: React with a simple component structure.

Plain English:
React is a practical choice for the interactive parts Raymond needs: quick capture, filters, lists, search, copy buttons, status updates, and a Morning Brief view.

Avoid a polished dashboard in Version 1. The frontend should be a quiet operating surface, not a decorative product.

### Backend
Recommendation: a small local backend.

Plain English:
The backend is the local engine that saves records, searches data, prepares exports, and calls AI when Raymond asks for help. It does not need cloud hosting in Version 1.

### Storage
Recommendation: SQLite as the local app database.

Plain English:
SQLite is a single local database file. It is simple to back up, easy to move, and strong enough for structured records like tasks, projects, prompts, and brief items.

### Search
Recommendation: SQLite full-text search plus filters.

Plain English:
Version 1 needs reliable keyword search for titles, notes, tags, prompts, resources, and arsenal items. SQLite can handle this without adding a separate search server.

### AI Assistance
Recommendation: AI is request-driven and evidence-based.

Plain English:
AI should help classify captures, draft summaries, assemble the Morning Brief, and suggest priorities. It should not silently act in the background or read external systems in Version 1.

### Local-First or Cloud
Recommendation: local-first.

Plain English:
The first version should prioritize control, privacy, simplicity, backup, and trust. Cloud sync and multi-device access can come later if the local system proves useful.

## 3. Data Architecture
Version 1 should use a small number of structured record types. Each record should be easy to understand and export.

### Capture
Purpose: raw intake before organization.

Minimum fields:
- id
- title
- raw_text
- source
- captured_at
- suggested_type
- status
- related_project_id
- why_it_matters
- ai_confidence
- ai_reasoning
- reviewed_at

Relationship:
- A capture can become a task, review-later resource, project update, prompt, arsenal item, or remain archived.

### Task
Purpose: actionable work or decision.

Minimum fields:
- id
- title
- description
- status
- priority
- due_date
- follow_up_date
- related_project_id
- waiting_on_person
- requires_raymond
- next_action
- evidence
- created_from_capture_id

Relationship:
- A task can belong to a project.
- A task can create a Morning Brief item.

### Follow-Up
Purpose: track waiting loops and items that should not disappear.

Minimum fields:
- id
- title
- waiting_on
- related_task_id
- related_project_id
- status
- last_contacted_at
- follow_up_date
- reason_waiting
- next_action

Relationship:
- A follow-up can be linked to a task or project.
- Follow-ups feed Waiting on Others and Needs Verification.

### Review-Later Resource
Purpose: save knowledge with context.

Minimum fields:
- id
- title
- url_or_location
- resource_type
- saved_at
- why_it_matters
- tags
- status
- related_project_id
- possible_use
- notes

Relationship:
- A resource can become FYI, a task, or project reference.

### Project
Purpose: track active projects and resume context.

Minimum fields:
- id
- name
- status
- current_phase
- priority
- source_of_truth
- last_completed_step
- current_blocker
- next_action
- waiting_on
- due_date
- active_reason
- last_reviewed_at

Active project definition:
- Currently being worked on
- Blocked
- Waiting for Raymond's approval
- Waiting on another person
- Due within 30 days

### Project Update
Purpose: preserve project movement over time.

Minimum fields:
- id
- project_id
- update_text
- update_type
- created_at
- source
- decision_recorded
- next_action

Relationship:
- Project updates feed Get Back on Track summaries.

### Arsenal Item
Purpose: searchable inventory of reusable tools and workflows.

Minimum fields:
- id
- name
- type
- what_it_solves
- when_to_use
- how_to_access
- example_usage
- related_project_id
- tags
- status
- notes
- last_used_at

Version 1 boundary:
- Searchable inventory only.
- No automatic crawling.
- No activation or management.

### Prompt
Purpose: searchable prompt library with copy support.

Minimum fields:
- id
- title
- purpose
- full_prompt
- category
- tags
- related_project_id
- tool_or_model
- notes
- favorite
- last_used_at
- updated_at

Version 1 boundary:
- Searchable with copy support only.
- No advanced version history.
- No automated recommendation engine.

### Morning Brief Item
Purpose: assembled view item, not a separate source of truth.

Minimum fields:
- id
- brief_date
- section
- title
- summary
- reason
- confidence
- importance
- evidence_refs
- suggested_action
- source_record_type
- source_record_id
- resolved_status

Relationship:
- Morning Brief items point back to source records.
- They should not duplicate tasks or projects as independent truth.

## 4. Source-of-Truth Rules
### What Owns Each Record
- Captures are owned by the Command Center app.
- Tasks and follow-ups are owned by the Command Center app for Version 1.
- Review Later resources are owned by the Command Center app.
- Projects are owned by the Command Center app for Version 1 summaries, but may reference existing project binder files as source material.
- Arsenal items and prompts are owned by the Command Center app as searchable inventory records.
- Morning Brief items are generated views that point to source records.

### Files and App Data
The app database should own live structured records.

Markdown and JSON exports should be generated for portability, backup, review, and long-term readability.

Plain English:
The database is the working notebook. Markdown and JSON are the clean copies Raymond can read, back up, and move.

### Avoiding Duplicate Task or Project Systems
Version 1 must not automatically import or create tasks from the wider AI OS.

Safe rule:
- Internal Command Center tasks live in the Command Center.
- Existing AI OS project binders remain higher-level project documentation.
- The Command Center can reference binder paths, but it should not overwrite or compete with them.

### Markdown or Database as Permanent Source of Truth
Recommendation:
- The app database is the operational source of truth for Version 1 records.
- The project binder remains the source of truth for product decisions, PRDs, architecture, and project governance.
- Markdown and JSON exports are the portability and backup format.

Why:
Using Markdown as the live app database would make filtering, linking, confidence tracking, correction history, and brief generation more fragile. Using SQLite keeps the app reliable while exports keep Raymond from being trapped.

## 5. AI-Assisted Workflow
### Raw Capture to Proposed Classification
1. Raymond enters a raw capture.
2. The app saves it exactly as entered.
3. AI suggests a type: task, follow-up, review-later resource, project update, prompt, arsenal item, or FYI.
4. AI explains the suggestion and shows confidence.
5. Raymond approves, edits, or rejects the classification.
6. The approved result becomes a structured record.

Deterministic:
- Save raw capture.
- Track status.
- Link approved record.
- Preserve timestamps and source.

AI-generated:
- Suggested type.
- Suggested priority.
- Suggested project link.
- Reasoning.
- Next action.

### Raymond Approves or Corrects
Every AI suggestion should be reviewable before it changes an important record.

Correction actions:
- Accept
- Edit
- Reclassify
- Mark Requires Me
- Mark Waiting on Someone Else
- Mark FYI Only
- Create Task
- Link to Existing Issue
- Dismiss

Corrections become preference data for future classification.

### Get Back on Track Summaries
The summary should be generated from structured project data and project updates.

Inputs:
- Project record
- Recent project updates
- Open tasks
- Open follow-ups
- Current blocker
- Next action

Output:
- 30-second summary
- Last completed step
- Current blocker
- Waiting on
- Exact next action

Deterministic:
- Which project is active.
- Which tasks are open.
- Which follow-ups are waiting.
- Which due dates exist.

AI-generated:
- Concise summary wording.
- Suggested next action.
- Blocker explanation.

### Morning Brief Assembly
Version 1 Morning Brief reads only from:
- Projects
- Tasks
- Review Later
- Brain Dump

The brief should not read Gmail, Calendar, GitHub, Notion, Slack, or external APIs.

Process:
1. Gather candidate records from internal modules.
2. Apply deterministic filters for due dates, waiting items, blockers, active projects, and unresolved captures.
3. Ask AI to classify candidates into Requires Raymond, Needs Verification, or FYI.
4. Require AI to provide reasoning, evidence, confidence, importance, and suggested action.
5. Limit Requires Raymond to a target of 3-5 items and normally no more than 7.
6. Raymond reviews, corrects, or accepts the brief.

Deterministic:
- Candidate gathering.
- Date filtering.
- Active project definition.
- Section limits.
- Source references.

AI-generated:
- Section recommendation.
- Reasoning.
- Priority ranking.
- Summary language.

## 6. Search Architecture
### Keyword Search
Version 1 should use keyword search across:
- Captures
- Tasks
- Review Later
- Projects
- Arsenal items
- Prompts

### Tags
Records should support simple tags such as:
- tenant
- contractor
- realtor
- AI
- prompt
- urgent
- waiting
- project
- research

Tags should help filtering, not become a complicated taxonomy.

### Filters
Useful Version 1 filters:
- Type
- Status
- Priority
- Related project
- Waiting on
- Due date
- Tag
- Favorite
- Active project

### Semantic Search
Recommendation: not necessary in Version 1.

Plain English:
Semantic search can be powerful, but it adds complexity, cost, privacy concerns, and another system to maintain. Start with strong keyword search, tags, and filters. Add semantic search only if keyword search fails in real use.

### Prompts and My Arsenal
Prompt Library and My Arsenal should use:
- Keyword search
- Tags
- Type filter
- Related project filter
- Favorite filter for prompts
- Status filter for arsenal items

No automated recommendations in Version 1.

## 7. Privacy and Security
### Local Data Handling
Version 1 data should live on Raymond's machine.

The local database may include sensitive business, tenant, project, and personal information. It should not be synced to cloud services by default.

### Sensitive Tenant and Business Information
The app should assume records may include:
- Tenant issues
- Contractor names
- Deal context
- Business strategy
- Project decisions
- Personal obligations

This means evidence and AI prompts should include only what is necessary for the requested task.

### API Key Storage
API keys should not be stored in plain text project files.

Recommended approach:
- Use local environment variables or an operating-system keychain in later implementation.
- Never commit API keys to the project folder.
- Keep `.env` files out of exports.

### Backups
Recommended backup objects:
- SQLite database file
- Markdown exports
- JSON exports
- Project binder

Backups should be simple enough that Raymond understands what to copy.

### Risks of External AI Models
Using external AI models may send selected text to a third-party service.

Risk controls:
- Use AI only when Raymond requests assistance.
- Send the smallest useful context.
- Show evidence and reasoning.
- Do not send external source data in Version 1 because external integrations are out of scope.
- Allow AI-off workflows for manual entry, search, and review.

## 8. Backup and Portability
### Export Format
Every major record type should export to:
- JSON for complete structured recovery
- Markdown for human-readable review

### Recovery
Raymond should be able to restore from:
- The SQLite database file, if available.
- JSON exports, if the database is lost.
- Markdown exports for human reference.

### Avoiding Lock-In
Avoid lock-in by keeping:
- Simple record types
- Plain field names
- JSON exports
- Markdown exports
- No proprietary cloud-only storage

### Readable Data
Even if the app stops working, Raymond should still be able to open exported Markdown and understand:
- What tasks existed
- What projects were active
- What was waiting
- What resources were saved and why
- What prompts and arsenal items existed

## 9. Migration Plan
### Existing Project Binder Files
The app may index or reference existing project binder files manually after Raymond approves.

Safe Version 1 approach:
- Start with clean internal records.
- Allow project records to include a `source_of_truth` path.
- Do not automatically import old project content.
- Do not rewrite binder files from the app.

### What Should Not Be Imported Automatically
Do not automatically import:
- Former outdated Command Center files
- Old archived project content
- Gmail
- Calendar
- GitHub
- Notion
- Slack
- External APIs
- Unreviewed task lists
- Unreviewed prompt collections

### Avoiding Stale Project Contamination
Use these rules:
- New records require current Raymond approval or fresh capture.
- Imported references must be marked with source and review date.
- Old material should be labeled "reference only" until reviewed.
- Active project status must follow the approved Version 1 definition.

## 10. Build Phases
These are implementation phases for later. They are not permission to start coding yet.

### Phase 2A: Architecture Approval
Review and approve this technical architecture proposal.

### Phase 3A: Foundation
Create local app shell, local storage, export strategy, and basic record model.

### Phase 3B: Capture
Build Universal Brain Dump / Quick Capture and manual review of captured items.

### Phase 3C: Tasks and Follow-Ups
Build lightweight tasks, follow-ups, waiting-on, due dates, and status filters.

### Phase 3D: Review Later
Build resource saving with why-it-matters, tags, status, and project linking.

### Phase 3E: Projects
Build Projects on the Go and Get Back on Track summaries from internal project records.

### Phase 3F: Arsenal and Prompts
Build Minimal My Arsenal and Minimal Prompt Library with search and copy support.

### Phase 3G: Morning Brief
Build AI-assisted read-only Morning Executive Brief from internal modules only.

### Phase 3H: Testing
Test:
- Capture flow
- Classification review
- Search
- Exports
- Project summaries
- Brief section rules
- Requires Raymond item limit
- No external source access

## 11. Risks and Tradeoffs
### Overbuilding
Risk: My Arsenal, Prompt Library, or Morning Brief becomes too ambitious.

Control: Keep Version 1 boundaries visible in the app and architecture.

### Duplicate Sources of Truth
Risk: The app competes with existing AI OS project binders.

Control: App records are operational. Binder files are governance and project documentation. The app references binder paths but does not overwrite them.

### AI Misclassification
Risk: AI puts an item in the wrong section or misses importance.

Control: Show confidence, reasoning, evidence, and correction actions. Keep AI-assisted, not autonomous.

### Stale Data
Risk: The Morning Brief becomes wrong if internal records are not maintained.

Control: Make capture and updates fast. Show last reviewed and last updated. Surface stale active projects in Needs Verification.

### Search Quality
Risk: Keyword search may miss loosely related items.

Control: Use tags, filters, clear titles, and good notes first. Defer semantic search until proven necessary.

### Maintenance Burden
Risk: Too many moving parts make the app fragile.

Control: One local app, one local database, no microservices, no external integrations in Version 1.

### Token and API Costs
Risk: AI summaries and briefs become expensive or slow.

Control: Use AI on demand, send only selected internal records, and cache generated summaries until source records change.

## 12. Architecture Decision
Build Version 1 as a local-first web app using a simple React frontend, a small local backend, SQLite for structured storage, SQLite full-text search for keyword search, request-driven AI assistance, and Markdown/JSON exports for portability.

The live operational source of truth should be the local SQLite database. The project binder remains the source of truth for product, architecture, decisions, and governance. Markdown and JSON exports keep Raymond's data readable, movable, and recoverable.

Do not use microservices, cloud infrastructure, vector databases, collaboration features, external integrations, autonomous actions, or a desktop wrapper in Version 1.
