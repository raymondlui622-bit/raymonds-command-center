export const RAW_CAPTURE_STATUSES = Object.freeze([
  "new",
  "proposed",
  "processed",
  "archived",
]);

export function migrateRawCaptures(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS raw_captures (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'proposed', 'processed', 'archived')),
      captured_at TEXT NOT NULL DEFAULT (datetime('now')),
      title TEXT,
      suggested_type TEXT,
      related_project_id TEXT,
      why_it_matters TEXT,
      ai_confidence REAL CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
      concise_ai_reason TEXT,
      reviewed_at TEXT,
      archived_at TEXT
    )
  `);
}
