# Raymond Command Center - Lessons

## Initial Lessons
- Start with operational bottlenecks, not decorative dashboards.
- Capture first, organize afterward.
- Preserve why a resource was saved, not only its URL.
- Keep statuses and fields simple enough that Raymond will actually use them.
- Build small working modules that later feed the Morning Executive Brief.

## Product Discovery Lessons
- The Command Center should reduce Raymond's manual checking, not create a new place to check.
- The homepage should eventually be a Morning Executive Brief, not a module launcher.
- The brief must separate confirmed attention items from uncertain items.
- Trust depends on reasoning, confidence, evidence, and learning from corrections.
- Requires Raymond is a high bar. New, unread, or related is not enough.
- Needs Verification protects trust without polluting the main brief.
- FYI belongs below operational priorities and should not compete with them.
- My Arsenal and Prompt Library are valuable because they reduce search and recall burden, but they must stay minimal in Version 1.
- Phase 1 should now be treated as frozen. Further work should move into technical architecture instead of reopening broad product brainstorming.
- The main architecture risk is duplicate sources of truth, so Version 1 needs a clear split between operational app data and binder governance files.
- Semantic search, cloud sync, and external integrations should be earned by real need, not added by default.
- The data model should preserve raw input and important history without introducing event-sourcing complexity.
- Follow-ups should not become a second action system in Version 1. Waiting tasks are simpler and easier to understand.
- Once the data model is approved, architecture should stay frozen unless implementation reveals a real issue.
- Implementation should move in small, independently testable milestones rather than attempting the whole Command Center at once.
- Database structures should be added just in time with their modules, not all at once up front.
- Exports are more useful after meaningful module data exists.
- A milestone is not complete until it has a commit, summary, rollback instructions, and manual test results.
- Milestone 1 should prove the local development loop only; even harmless-looking UI structure can accidentally become premature product design.
- Node's built-in SQLite module is enough for the Milestone 1 connection check, avoiding an extra backend dependency.
- Local server startup may require elevated permission in the managed sandbox even when binding only to localhost.
- Morning Brief items should be snapshots pointing back to sources, not a second place where tasks or projects live.
- Milestone 2 confirmed that an idempotent table-specific migration is enough for the first data slice; a migration framework can be deferred until there is a real need.
- Node SQLite query rows use a null-prototype object shape, so tests should assert the behavioral contract instead of overfitting to plain object identity.
- A minimal HTTP handler layer is enough for the first usable feature; a backend routing framework remains unnecessary.
- Raw Capture UI should stay plain until more modules exist, because polish now could accidentally become dashboard design.
- Task completion and archiving should update only their own status/timestamp fields so a state change cannot overwrite unrelated edits.
- The no-separate-Follow-Up rule is easy to protect with a direct table-existence regression test.
- Review Later fits the same simple module pattern as Tasks: migration, data access, handler, minimal view, and focused tests.
- Future project links can be represented as nullable IDs before the Projects table exists, avoiding a premature foreign-key or relationship layer.
- Milestone table-regression tests need to evolve as approved modules land, while still blocking unapproved future tables.
- Project Updates should have create/list/read-style behavior only; omitting update/delete paths is the simplest way to preserve append-only history.
- Calculated fields like `due_soon` are safest when added to returned objects instead of persisted schema.
- Project linking for Tasks and Review Later can stay as one nullable string field until a later milestone proves stricter relationship behavior is needed.
- Milestone 7 did not need a search index table yet; direct keyword queries over the existing local SQLite tables were enough for the approved acceptance checks.
- Search filters should respect the fields each record actually has. Project Updates have no status, so status-filtered searches should not pretend they do.
- Keeping tags as a simple string keeps Review Later searchable without introducing taxonomy or tag-table maintenance too early.
