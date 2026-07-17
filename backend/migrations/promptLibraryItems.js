export const PROMPT_LIBRARY_ITEM_STATUSES = Object.freeze(["active", "archived"]);

export function migratePromptLibraryItems(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS prompt_library_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      full_prompt TEXT NOT NULL,
      tags TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
