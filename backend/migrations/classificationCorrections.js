export function migrateClassificationCorrections(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS classification_corrections (
      id TEXT PRIMARY KEY,
      raw_capture_id TEXT NOT NULL,
      suggested_record_type TEXT NOT NULL,
      corrected_record_type TEXT NOT NULL,
      original_suggestion TEXT NOT NULL,
      corrected_values TEXT,
      correction_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
