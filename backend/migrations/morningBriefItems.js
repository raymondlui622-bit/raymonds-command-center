export const MORNING_BRIEF_SECTIONS = Object.freeze([
  "requires_raymond",
  "needs_verification",
  "waiting_on_others",
  "fyi",
]);

export const MORNING_BRIEF_REVIEW_STATUSES = Object.freeze([
  "proposed",
  "accepted",
  "corrected",
  "dismissed",
  "resolved",
]);

export const MORNING_BRIEF_IMPORTANCE_LEVELS = Object.freeze(["high", "medium", "low"]);

export function migrateMorningBriefItems(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS morning_brief_items (
      id TEXT PRIMARY KEY,
      brief_batch_id TEXT NOT NULL,
      brief_date TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      section TEXT NOT NULL
        CHECK (section IN ('requires_raymond', 'needs_verification', 'waiting_on_others', 'fyi')),
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      reason TEXT NOT NULL,
      confidence REAL NOT NULL,
      importance TEXT NOT NULL
        CHECK (importance IN ('high', 'medium', 'low')),
      source_refs TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      ai_narrative TEXT,
      review_status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (review_status IN ('proposed', 'accepted', 'corrected', 'dismissed', 'resolved')),
      corrected_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
