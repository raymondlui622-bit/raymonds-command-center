import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  getLatestMorningBriefBatch,
  getMorningBriefItemById,
  insertMorningBriefBatch,
  listMorningBriefHistory,
  updateMorningBriefItemReview,
} from "./morningBriefItems.js";

function sampleItems(overrides = {}) {
  const briefBatchId = overrides.brief_batch_id ?? "batch-1";
  const generatedAt = overrides.generated_at ?? "2026-07-17T09:00:00.000Z";
  const briefDate = overrides.brief_date ?? "2026-07-17";

  return [
    {
      id: `${briefBatchId}-item-1`,
      brief_batch_id: briefBatchId,
      brief_date: briefDate,
      generated_at: generatedAt,
      section: "requires_raymond",
      title: "Approve contractor quote",
      summary: "Quote needs approval",
      reason: "Task is marked as requiring Raymond's attention.",
      confidence: 1.0,
      importance: "high",
      source_refs: [{ record_type: "task", id: "task-1" }],
      suggested_action: "Review and decide.",
      ai_narrative: null,
      review_status: "proposed",
      corrected_note: null,
    },
    {
      id: `${briefBatchId}-item-2`,
      brief_batch_id: briefBatchId,
      brief_date: briefDate,
      generated_at: generatedAt,
      section: "fyi",
      title: "Interesting repo",
      summary: "Saved for later",
      reason: "Saved resource not yet actioned.",
      confidence: 1.0,
      importance: "low",
      source_refs: [{ record_type: "review_later_resource", id: "resource-1" }],
      suggested_action: "Read when convenient.",
      ai_narrative: null,
      review_status: "proposed",
      corrected_note: null,
    },
  ];
}

test("insertMorningBriefBatch persists items sharing one brief_batch_id and round-trips source_refs", () => {
  const database = createTestDatabase();
  try {
    const saved = insertMorningBriefBatch(database, sampleItems());

    assert.equal(saved.length, 2);
    assert.equal(saved[0].brief_batch_id, "batch-1");
    assert.equal(saved[1].brief_batch_id, "batch-1");
    assert.deepEqual(saved[0].source_refs, [{ record_type: "task", id: "task-1" }]);

    const fetched = getMorningBriefItemById(database, saved[0].id);
    assert.equal(fetched.title, "Approve contractor quote");
    assert.deepEqual(fetched.source_refs, [{ record_type: "task", id: "task-1" }]);
  } finally {
    database.close();
  }
});

test("getLatestMorningBriefBatch returns only the newest batch by generated_at", () => {
  const database = createTestDatabase();
  try {
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-older", generated_at: "2026-07-16T09:00:00.000Z" }),
    );
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-newer", generated_at: "2026-07-17T09:00:00.000Z" }),
    );

    const latest = getLatestMorningBriefBatch(database);
    assert.equal(latest.length, 2);
    assert.equal(
      latest.every((item) => item.brief_batch_id === "batch-newer"),
      true,
    );
  } finally {
    database.close();
  }
});

test("getLatestMorningBriefBatch breaks generated_at ties by insertion order, not random id", () => {
  const database = createTestDatabase();
  try {
    const sameTimestamp = "2026-07-17T09:00:00.000Z";
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-first", generated_at: sameTimestamp }),
    );
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-second", generated_at: sameTimestamp }),
    );

    const latest = getLatestMorningBriefBatch(database);
    assert.equal(
      latest.every((item) => item.brief_batch_id === "batch-second"),
      true,
    );
  } finally {
    database.close();
  }
});

test("listMorningBriefHistory groups by brief_batch_id with per-section counts", () => {
  const database = createTestDatabase();
  try {
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-a", generated_at: "2026-07-16T09:00:00.000Z" }),
    );
    insertMorningBriefBatch(
      database,
      sampleItems({ brief_batch_id: "batch-b", generated_at: "2026-07-17T09:00:00.000Z" }),
    );

    const history = listMorningBriefHistory(database);
    assert.equal(history.length, 2);
    assert.equal(history[0].brief_batch_id, "batch-b");
    assert.equal(history[0].counts.requires_raymond, 1);
    assert.equal(history[0].counts.fyi, 1);
    assert.equal(history[0].counts.needs_verification, 0);
    assert.equal(history[1].brief_batch_id, "batch-a");
  } finally {
    database.close();
  }
});

test("updateMorningBriefItemReview accepts, dismisses, and corrects an item without touching others", () => {
  const database = createTestDatabase();
  try {
    const [item] = insertMorningBriefBatch(database, sampleItems());

    const accepted = updateMorningBriefItemReview(database, item.id, {
      review_status: "accepted",
    });
    assert.equal(accepted.review_status, "accepted");
    assert.equal(accepted.section, "requires_raymond");

    const corrected = updateMorningBriefItemReview(database, item.id, {
      review_status: "corrected",
      section: "waiting_on_others",
      corrected_note: "Actually waiting on the contractor.",
    });
    assert.equal(corrected.review_status, "corrected");
    assert.equal(corrected.section, "waiting_on_others");
    assert.equal(corrected.corrected_note, "Actually waiting on the contractor.");

    assert.equal(corrected.title, item.title);
    assert.equal(corrected.brief_batch_id, item.brief_batch_id);
    assert.equal(corrected.generated_at, item.generated_at);
  } finally {
    database.close();
  }
});

test("updateMorningBriefItemReview returns null for a missing item", () => {
  const database = createTestDatabase();
  try {
    assert.equal(updateMorningBriefItemReview(database, "missing", { review_status: "accepted" }), null);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
