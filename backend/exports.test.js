import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createArsenalItem } from "./arsenalItems.js";
import { arsenalItemFixture } from "./arsenalItems.fixture.js";
import { createClassificationCorrection } from "./classificationCorrections.js";
import { initializeDatabase } from "./db.js";
import { buildExportPayload, renderMarkdownExport } from "./exports.js";
import { insertMorningBriefBatch } from "./morningBriefItems.js";
import { createPromptLibraryItem } from "./promptLibraryItems.js";
import { promptLibraryItemFixture } from "./promptLibraryItems.fixture.js";
import { createProject, createProjectUpdate } from "./projects.js";
import { projectFixture, projectUpdateFixture } from "./projects.fixture.js";
import { createRawCapture } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";
import { createReviewLaterResource } from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("builds a read-only JSON export with all Version 1 record groups", () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    seedExportRecords(database);
    const before = snapshotTables(database);

    const payload = buildExportPayload(database, "2026-07-17T12:00:00.000Z");

    assert.deepEqual(payload.metadata, {
      exported_at: "2026-07-17T12:00:00.000Z",
      format_version: "1",
      application_version: "0.0.0",
    });

    assert.equal(payload.data.raw_captures.length, 1);
    assert.equal(payload.data.tasks.length, 1);
    assert.equal(payload.data.review_later_resources.length, 1);
    assert.equal(payload.data.projects.length, 1);
    assert.equal(payload.data.project_updates.length, 1);
    assert.equal(payload.data.arsenal_items.length, 1);
    assert.equal(payload.data.prompt_library_items.length, 1);
    assert.equal(payload.data.classification_corrections.length, 1);
    assert.equal(payload.data.morning_brief_items.length, 1);

    assert.equal(payload.data.raw_captures[0].status, "archived");
    assert.equal(payload.data.tasks[0].status, "archived");
    assert.equal(payload.data.review_later_resources[0].status, "archived");
    assert.equal(payload.data.projects[0].status, "archived");
    assert.equal(payload.data.arsenal_items[0].status, "archived");
    assert.equal(payload.data.prompt_library_items[0].status, "archived");

    assertStoredFields(database, "raw_captures", payload.data.raw_captures[0]);
    assertStoredFields(database, "tasks", payload.data.tasks[0]);
    assertStoredFields(database, "review_later_resources", payload.data.review_later_resources[0]);
    assertStoredFields(database, "projects", payload.data.projects[0]);
    assertStoredFields(database, "project_updates", payload.data.project_updates[0]);
    assertStoredFields(database, "arsenal_items", payload.data.arsenal_items[0]);
    assertStoredFields(database, "prompt_library_items", payload.data.prompt_library_items[0]);
    assertStoredFields(database, "classification_corrections", payload.data.classification_corrections[0]);
    assertStoredFields(database, "morning_brief_items", payload.data.morning_brief_items[0]);

    assert.deepEqual(snapshotTables(database), before);
  } finally {
    database.close();
  }
});

test("renders a readable Markdown export with all Version 1 record groups", () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    seedExportRecords(database);

    const markdown = renderMarkdownExport(database);

    assert.match(markdown, /^# Raymond Command Center Export/);
    assert.match(markdown, /## Metadata/);
    assert.match(markdown, /## Raw Captures/);
    assert.match(markdown, /## Tasks/);
    assert.match(markdown, /## Review Later Resources/);
    assert.match(markdown, /## Projects/);
    assert.match(markdown, /## Project Updates/);
    assert.match(markdown, /## My Arsenal Items/);
    assert.match(markdown, /## Prompt Library Items/);
    assert.match(markdown, /## Classification Corrections/);
    assert.match(markdown, /## Morning Brief Items/);
    assert.match(markdown, /\| archived_at \| 2026-07-17T12:00:00.000Z \|/);
    assert.match(markdown, /\| update_text \| Export milestone update \|/);
    assert.match(markdown, /\| name \| Export archived arsenal item \|/);
    assert.match(markdown, /\| title \| Export archived prompt \|/);
    assert.match(markdown, /\| correction_note \| This should be a resource. \|/);
    assert.match(markdown, /\| brief_batch_id \| export-brief-batch \|/);
  } finally {
    database.close();
  }
});

function seedExportRecords(database) {
  createRawCapture(
    database,
    rawCaptureFixture({
      id: "export-capture",
      raw_text: "Export archived capture",
      status: "archived",
      archived_at: "2026-07-17T12:00:00.000Z",
    }),
  );

  createTask(
    database,
    taskFixture({
      id: "export-task",
      title: "Export archived task",
      status: "archived",
      archived_at: "2026-07-17T12:00:00.000Z",
    }),
  );

  createReviewLaterResource(
    database,
    reviewLaterResourceFixture({
      id: "export-resource",
      title: "Export archived resource",
      status: "archived",
      archived_at: "2026-07-17T12:00:00.000Z",
    }),
  );

  const project = createProject(
    database,
    projectFixture({
      id: "export-project",
      name: "Export archived project",
      status: "archived",
      archived_at: "2026-07-17T12:00:00.000Z",
    }),
  );

  createProjectUpdate(
    database,
    project.id,
    projectUpdateFixture({
      id: "export-update",
      update_text: "Export milestone update",
    }),
  );

  createArsenalItem(
    database,
    arsenalItemFixture({
      id: "export-arsenal",
      name: "Export archived arsenal item",
      status: "archived",
    }),
  );

  createPromptLibraryItem(
    database,
    promptLibraryItemFixture({
      id: "export-prompt",
      title: "Export archived prompt",
      status: "archived",
    }),
  );

  createClassificationCorrection(database, {
    id: "export-correction",
    raw_capture_id: "export-capture",
    suggested_record_type: "task",
    corrected_record_type: "review_later_resource",
    original_suggestion: { proposed_record_type: "task" },
    corrected_values: { title: "Export archived resource" },
    correction_note: "This should be a resource.",
    created_at: "2026-07-17T12:00:00.000Z",
  });

  insertMorningBriefBatch(database, [
    {
      id: "export-brief-item",
      brief_batch_id: "export-brief-batch",
      brief_date: "2026-07-17",
      generated_at: "2026-07-17T12:00:00.000Z",
      section: "requires_raymond",
      title: "Export brief item",
      summary: "Export should include Morning Brief snapshots.",
      reason: "Morning Brief Items are an approved Version 1 record type.",
      confidence: 1.0,
      importance: "high",
      source_refs: [{ record_type: "task", id: "export-task" }],
      suggested_action: "Verify export coverage.",
      ai_narrative: null,
      review_status: "proposed",
      corrected_note: null,
      created_at: "2026-07-17T12:00:00.000Z",
    },
  ]);
}

function assertStoredFields(database, tableName, exportedRecord) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
  assert.deepEqual(Object.keys(exportedRecord), columns);
}

function snapshotTables(database) {
  return {
    raw_captures: database.prepare("SELECT * FROM raw_captures ORDER BY id").all(),
    tasks: database.prepare("SELECT * FROM tasks ORDER BY id").all(),
    review_later_resources: database.prepare("SELECT * FROM review_later_resources ORDER BY id").all(),
    projects: database.prepare("SELECT * FROM projects ORDER BY id").all(),
    project_updates: database.prepare("SELECT * FROM project_updates ORDER BY id").all(),
    arsenal_items: database.prepare("SELECT * FROM arsenal_items ORDER BY id").all(),
    prompt_library_items: database.prepare("SELECT * FROM prompt_library_items ORDER BY id").all(),
    classification_corrections: database
      .prepare("SELECT * FROM classification_corrections ORDER BY id")
      .all(),
    morning_brief_items: database.prepare("SELECT * FROM morning_brief_items ORDER BY id").all(),
  };
}
