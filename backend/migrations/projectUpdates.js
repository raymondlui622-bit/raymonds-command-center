export function migrateProjectUpdates(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS project_updates (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      update_text TEXT NOT NULL,
      update_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT,
      decision_recorded TEXT,
      next_action TEXT,
      evidence_refs TEXT
    )
  `);
}
