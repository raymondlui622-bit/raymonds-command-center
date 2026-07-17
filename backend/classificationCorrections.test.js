import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  createClassificationCorrection,
  getClassificationCorrectionById,
  listClassificationCorrections,
} from "./classificationCorrections.js";

test("classification correction migration creates the approved table fields", () => {
  const database = createTestDatabase();
  try {
    const fields = database
      .prepare("PRAGMA table_info(classification_corrections)")
      .all()
      .map((field) => field.name);

    assert.deepEqual(fields, [
      "id",
      "raw_capture_id",
      "suggested_record_type",
      "corrected_record_type",
      "original_suggestion",
      "corrected_values",
      "correction_note",
      "created_at",
    ]);
  } finally {
    database.close();
  }
});

test("creates, reads, and lists classification corrections as history", () => {
  const database = createTestDatabase();
  try {
    const correction = createClassificationCorrection(database, {
      id: "correction-1",
      raw_capture_id: "capture-1",
      suggested_record_type: "task",
      corrected_record_type: "review_later_resource",
      original_suggestion: { proposed_record_type: "task" },
      corrected_values: { title: "Useful resource" },
      correction_note: "This was a resource, not an action.",
      created_at: "2026-07-17T10:00:00.000Z",
    });

    const stored = getClassificationCorrectionById(database, correction.id);
    const listed = listClassificationCorrections(database);

    assert.equal(stored.raw_capture_id, "capture-1");
    assert.equal(stored.suggested_record_type, "task");
    assert.equal(stored.corrected_record_type, "review_later_resource");
    assert.equal(stored.original_suggestion, '{"proposed_record_type":"task"}');
    assert.equal(stored.corrected_values, '{"title":"Useful resource"}');
    assert.equal(listed.length, 1);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
