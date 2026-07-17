export const ARSENAL_ITEM_STATUSES = Object.freeze(["active", "archived"]);

export function migrateArsenalItems(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS arsenal_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      url TEXT,
      tags TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
