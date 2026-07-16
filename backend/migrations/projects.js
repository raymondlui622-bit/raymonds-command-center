export const PROJECT_STATUSES = Object.freeze([
  "active",
  "blocked",
  "waiting",
  "paused",
  "completed",
  "archived",
]);

export function migrateProjects(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'blocked', 'waiting', 'paused', 'completed', 'archived')),
      current_phase TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      source_of_truth TEXT,
      last_completed_step TEXT,
      current_blocker TEXT,
      next_action TEXT,
      waiting_on TEXT,
      requires_raymond INTEGER NOT NULL DEFAULT 0 CHECK (requires_raymond IN (0, 1)),
      due_date TEXT,
      active_reason TEXT,
      last_reviewed_at TEXT,
      completed_at TEXT,
      archived_at TEXT
    )
  `);
}
