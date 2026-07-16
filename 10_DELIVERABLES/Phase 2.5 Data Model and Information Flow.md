# Raymond Command Center - Phase 2.5 Data Model and Information Flow

Status: Approved implementation source of truth
Date: 2026-07-16
Frozen sources: `10_DELIVERABLES/Phase 1 Approved PRD.md` and `10_DELIVERABLES/Phase 2 Technical Architecture Proposal.md`

## Purpose
Lock the Version 1 data model and information flow before implementation. This document does not repeat the full Phase 2 architecture.

## Data Model Principles
- SQLite owns live operational data.
- Binder Markdown owns governance, decisions, PRDs, and architecture.
- Markdown/JSON exports provide portability and backup.
- Use one primary project link per record.
- Preserve raw captures by default.
- Use Tasks as the single action and follow-up system.
- Store Project Updates as append-only history.
- Store Morning Brief Items as concise daily snapshots pointing back to source records.
- Use manual duplicate merging.

## Final Version 1 Record Types
1. Raw Captures
2. Tasks
3. Review Later Resources
4. Projects
5. Project Updates
6. My Arsenal Items
7. Prompt Library Items
8. Morning Brief Items
9. Classification Corrections

## Record Definitions
### 1. Raw Captures
Purpose: preserve unorganized input exactly as Raymond entered it.

Required fields: id, raw_text, source, status, captured_at.

Optional fields: title, suggested_type, related_project_id, why_it_matters, ai_confidence, concise_ai_reason, reviewed_at, archived_at.

Statuses: new, proposed, processed, archived.

Relationships: can create one or more outputs; can link to one primary project.

Archive/delete: archive by default. Hard delete only for accidental entries, test data, or sensitive content Raymond explicitly removes.

Example: `Follow up with electrician about Cory exterior lighting` becomes one waiting task.

### 2. Tasks
Purpose: single system for actions, decisions, reminders, waiting items, and follow-ups.

Required fields: id, title, status, priority, created_at.

Optional fields: description, related_project_id, due_date, waiting_on, follow_up_date, last_contacted_at, requires_raymond, next_action, evidence_refs, source_capture_id, completed_at, archived_at.

Statuses: open, in_progress, waiting, blocked, done, archived.

Waiting/follow-up design: a follow-up is a task with `status = waiting`. It should use `waiting_on`, `follow_up_date`, `last_contacted_at`, `next_action`, and optionally `related_project_id`.

Relationships: belongs to zero or one primary project; may be created from one raw capture; may appear in the Morning Brief.

Archive/delete: archive completed tasks. Hard delete only for accidental entries.

Example: `Confirm electrician visit`, `status = waiting`, `waiting_on = Electrician`, `follow_up_date = 2026-07-18`.

### 3. Review Later Resources
Purpose: save resources with why Raymond cared.

Required fields: id, title, resource_type, why_it_matters, status, saved_at.

Optional fields: url_or_location, related_project_id, possible_use, notes, tags, source_capture_id, reviewed_at, archived_at.

Statuses: new, reviewing, useful, turned_into_task, reference, dismissed, archived.

Relationships: can link to one primary project; can be created from a raw capture; can create a task; can appear as FYI.

Archive/delete: archived resources remain searchable. Hard delete only for accidental saves, duplicates after merge, or sensitive content.

Example: saved GitHub repository with URL and `why_it_matters`.

### 4. Projects
Purpose: track active work context, current state, and next action.

Required fields: id, name, status, current_phase, priority, created_at.

Optional fields: source_of_truth, last_completed_step, current_blocker, next_action, waiting_on, requires_raymond, due_date, active_reason, last_reviewed_at, completed_at, archived_at.

Statuses: active, blocked, waiting, paused, completed, archived.

Rules: do not store `due_soon`; calculate it from `due_date`. A project is active if it is being worked on, blocked, waiting for approval, waiting on someone, or due within 30 days. Store the reason in `active_reason`.

Relationships: has many Project Updates and Tasks; can link to Review Later Resources, Arsenal Items, and Prompt Library Items.

Archive/delete: archive completed or inactive projects. Hard delete only for accidental records.

Example: `Raymond Command Center`, status `active`, active_reason `currently being worked on`.

### 5. Project Updates
Purpose: preserve project history without overwriting it.

Required fields: id, project_id, update_text, update_type, created_at.

Optional fields: source, decision_recorded, next_action, evidence_refs.

Statuses: none in Version 1.

Relationships: belongs to one project; may reference a task, capture, or decision; feeds Get Back on Track summaries.

Archive/delete: archive with the project. Do not overwrite history; add a new update.

Example: `Phase 2 approved. Moving to Phase 2.5 data model review.`

### 6. My Arsenal Items
Purpose: searchable inventory of reusable tools, skills, workflows, plugins, automations, APIs, SOPs, and resources.

Required fields: id, name, type, what_it_solves, status, created_at.

Optional fields: when_to_use, how_to_access, example_usage, related_project_id, tags, notes, last_used_at, archived_at.

Statuses: active, experimental, installed, available, archived.

Relationships: can link to one primary project; searchable together with Prompt Library Items.

Archive/delete: archived items remain searchable but hidden from default active views. Hard delete only for accidents or duplicates after merge.

Example: `Prompt Master`, type `skill`, solves `improving reusable prompts`.

### 7. Prompt Library Items
Purpose: searchable prompt library with copy support.

Required fields: id, title, purpose, full_prompt, status, created_at.

Optional fields: category, tags, related_project_id, tool_or_model, notes, favorite, last_used_at, archived_at.

Statuses: active, experimental, archived.

Rules: `favorite` is a boolean, not a status.

Relationships: can link to one primary project; searchable together with My Arsenal Items.

Archive/delete: archived prompts remain searchable but hidden from default active views. Hard delete only for accidents or duplicates after merge.

Example: `Get Back on Track Summary`, favorite `true`.

### 8. Morning Brief Items
Purpose: concise daily snapshots of source-backed recommendations.

Required fields: id, brief_date, section, title, summary, reason, confidence, importance, source_refs, suggested_action, review_status, created_at.

Sections: requires_raymond, needs_verification, waiting_on_others, fyi.

Review statuses: proposed, accepted, corrected, dismissed, resolved.

Rules: store concise summary and concise reason only; do not store long AI reasoning; snapshot points back to source records and does not replace them.

Relationships: points to source records; can create a Classification Correction if Raymond changes it.

Archive/delete: keep snapshots by default for trust review. Hard delete only test or accidental generations.

Example: Requires Raymond item pointing to a task that needs approval.

### 9. Classification Corrections
Purpose: record Raymond's corrections so future AI classification can improve.

Required fields: id, target_record_type, target_record_id, original_classification, corrected_classification, correction_type, created_at.

Optional fields: reason, original_confidence, applied_to_future, notes.

Correction types: wrong_section, wrong_priority, wrong_project, wrong_type, duplicate, should_require_raymond, should_not_require_raymond, should_be_waiting, should_be_fyi.

Relationships: points to the corrected record or Morning Brief Item; can influence future AI prompts and classification rules.

Archive/delete: keep for trust history. Hard delete only accidental corrections.

Example: Raymond changes an item from Needs Verification to Requires Raymond and records why.

## Decision Answers
### Can One Task Belong to More Than One Project?
No for Version 1. Use one primary project plus tags and notes for cross-project relevance.

### Can One Raw Capture Create Multiple Outputs?
Yes. A raw capture can create multiple outputs, such as a task and a Review Later resource.

### Is the Original Raw Capture Always Preserved?
Yes, unless Raymond explicitly hard-deletes it.

### How Are Follow-Ups Different From Normal Tasks?
Follow-ups are not separate records. They are waiting tasks.

### How Is Waiting on Others Represented?
Waiting on Others is generated from tasks where `status = waiting`, especially when `waiting_on` is filled and `follow_up_date` is due or overdue.

### How Is an Active Project Determined?
Use the approved rule: worked on, blocked, waiting for approval, waiting on someone, or due within 30 days. Store the reason in `active_reason`.

### How Are Project Updates Stored Without Overwriting History?
Project Updates are append-only. Current project fields can update, but historical updates remain unchanged.

### How Is a Get Back on Track Summary Created and Refreshed?
Generate it from the Project record, recent Project Updates, open Tasks, waiting Tasks, blockers, and next action. Refresh when a Project Update is added, a related Task changes, or Raymond manually requests refresh.

### Is a Morning Brief Item Stored Permanently, Generated Temporarily, or Both?
Both. Generate from current source records, then store a concise daily snapshot.

### How Are Brief Sections Assigned?
Use deterministic filters first: due dates, waiting tasks, blockers, active projects, unresolved captures, and stale items. AI then proposes a section with concise reason, confidence, importance, and source references. Raymond can correct it.

### How Are Confidence, Evidence, and Source References Stored?
Use `confidence` from 0 to 1, `importance` as low/medium/high, `source_refs` as source record references, and `reason` as a concise plain-English explanation.

### How Are User Corrections Recorded?
Classification Corrections store original classification, corrected classification, correction type, reason, and whether to apply it to future behavior.

### How Are Duplicates Detected and Merged?
Detect using same URL, similar title, same source capture, same project plus similar next action, or same waiting_on plus similar issue. Merge manually only and preserve source references.

### How Do Prompt Library and My Arsenal Stay Separate but Searchable Together?
They remain separate records but share a unified search view. Prompt Library answers "What prompt can I reuse?" My Arsenal answers "What tool, workflow, skill, or resource can help?"

### What Is Included in Markdown and JSON Exports?
JSON exports include all fields needed to restore records. Markdown exports include readable summaries of captures, tasks, Review Later resources, projects, project updates, My Arsenal items, Prompt Library items, Morning Brief snapshots, and classification corrections.

## Information Flows
- Brain Dump becomes a Task: Raw Capture is saved, AI suggests Task, Raymond approves or edits, Task is created and linked back to the capture.
- Saved GitHub repository becomes Review Later: Raw Capture stores URL and reason, AI suggests Review Later, Raymond approves, Review Later record is created.
- Project Update changes current status: Project Update is saved as history, current field changes are reviewed, Project record updates only after approval.
- Contractor follow-up becomes Waiting on Others: Raw Capture becomes a Task with `status = waiting`, `waiting_on`, `follow_up_date`, and `next_action`.
- Task becomes Requires Raymond: task meets decision or approval criteria, AI proposes Requires Raymond with concise reason and sources, Morning Brief Item snapshot is stored.
- Uncertain item becomes Needs Verification: item enters through an internal module, AI detects possible importance but missing context, Morning Brief places it in Needs Verification.
- Completed item is archived but searchable: task is marked done, archived when no longer active, hidden from active views, still searchable and exportable.
- User correction changes future classification: Raymond corrects a classification, Classification Correction is stored, future AI prompts can include the correction pattern.

## Final Recommendation
Approve this simplified Version 1 model with nine record types and Tasks as the single action/follow-up system.

This avoids duplicate action systems while preserving raw input, project history, source references, Morning Brief trust history, and portability.

## Decisions Requiring Raymond Approval
1. Approve removing Follow-Ups as a separate Version 1 record type.
2. Approve waiting Tasks as the follow-up system.
3. Approve simplified Project statuses.
4. Approve simplified Prompt statuses with `favorite` as a boolean.
5. Approve concise Morning Brief snapshots instead of long stored AI reasoning.
