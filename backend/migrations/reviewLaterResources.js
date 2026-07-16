export const REVIEW_LATER_RESOURCE_STATUSES = Object.freeze([
  "new",
  "reviewing",
  "useful",
  "turned_into_task",
  "reference",
  "dismissed",
  "archived",
]);

export function migrateReviewLaterResources(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS review_later_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      why_it_matters TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'useful', 'turned_into_task', 'reference', 'dismissed', 'archived')),
      saved_at TEXT NOT NULL DEFAULT (datetime('now')),
      url_or_location TEXT,
      related_project_id TEXT,
      possible_use TEXT,
      notes TEXT,
      tags TEXT,
      source_capture_id TEXT,
      reviewed_at TEXT,
      archived_at TEXT
    )
  `);
}
