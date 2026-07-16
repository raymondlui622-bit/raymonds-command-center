# Raymond Command Center

## What This Is
Raymond Command Center is the project-level job binder for building Raymond's personal AI Executive Assistant and operator command center.

Its purpose is to reduce context switching, prevent operational items from falling through the cracks, organize captured thoughts and saved knowledge, and eventually support a useful Morning Executive Brief.

## Operating Instructions
- Keep this project clean and based only on the currently approved direction.
- Use plain English throughout.
- Treat this folder as the project-level job binder, not as a second AI OS.
- Treat the main AI OS files outside this folder as the higher-level source of truth.
- Record important choices in `07_Decisions.md`.
- Track current status in `05_Progress.md`.
- Keep actionable work in `06_Todo.md`.
- Put future generated outputs in `10_DELIVERABLES/`.
- Put durable project memory and supporting reference material in `09_MEMORY/`.

## Source-of-Truth Hierarchy
1. Main AI OS source-of-truth files outside this project.
2. This project binder.
3. Durable reference material inside `09_MEMORY/`.
4. Generated outputs inside `10_DELIVERABLES/`.
5. Session chat, which must be reflected back into the binder before it becomes durable.

## Scope Boundaries
- Do not build the application yet.
- Do not create a database yet.
- Do not create a second competing AI OS.
- Do not create duplicate task, project, or knowledge systems without first checking the existing AI OS architecture.
- Do not add outdated content from the former Raymond Command Center.
- Keep Brain Dump / To-Do Inbox and Review Later / Knowledge Queue as the first approved modules.

## Approval-First Rules
- Ask before changing project scope.
- Ask before adding new modules beyond the approved first two.
- Ask before importing old files, archived material, or former Command Center content.
- Ask before creating production application code, databases, automations, dashboards, or integrations.
- Ask before changing the binder structure.

## Verification Expectations
- Before creating or modifying project-level structure, check the existing binder files.
- Confirm that current work is consistent with `04_Blueprint.md`, `05_Progress.md`, `06_Todo.md`, and `07_Decisions.md`.
- Keep deferred ideas separate from approved work.
- Do not leave important decisions only in chat.

## Milestone Verification Gate
A milestone is not complete until it passes the Milestone Verification Gate:
- Clean git status.
- Successful local startup.
- Manual test checklist completed.
- Regression check against previous milestones.
- Binder updated.
- Git commit created.
- Rollback instructions verified.
- Short implementation summary.
- Recommendation to proceed or stop.

## Handover Expectations
At the end of a meaningful session:
- Update `05_Progress.md`.
- Update `06_Todo.md`.
- Add any important decisions to `07_Decisions.md`.
- Add durable lessons to `08_Lessons.md`.
- Leave a clear recommended next step.
