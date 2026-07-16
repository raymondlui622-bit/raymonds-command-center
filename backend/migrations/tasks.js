export const TASK_STATUSES = Object.freeze([
  "open",
  "in_progress",
  "waiting",
  "blocked",
  "done",
  "archived",
]);

export function migrateTasks(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'waiting', 'blocked', 'done', 'archived')),
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      description TEXT,
      related_project_id TEXT,
      due_date TEXT,
      waiting_on TEXT,
      follow_up_date TEXT,
      last_contacted_at TEXT,
      requires_raymond INTEGER NOT NULL DEFAULT 0 CHECK (requires_raymond IN (0, 1)),
      next_action TEXT,
      evidence_refs TEXT,
      source_capture_id TEXT,
      completed_at TEXT,
      archived_at TEXT
    )
  `);
}
