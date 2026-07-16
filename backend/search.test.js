import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { createProject, createProjectUpdate } from "./projects.js";
import { projectFixture, projectUpdateFixture } from "./projects.fixture.js";
import { createRawCapture } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";
import { createReviewLaterResource } from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";
import { searchRecords } from "./search.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("searches across implemented modules", () => {
  const database = createTestDatabase();
  try {
    const project = seedSearchRecords(database);

    assertSearchResult(database, { q: "tenant capture" }, "raw_capture", "capture-for-search");
    assertSearchResult(database, { q: "electrical task" }, "task", "task-for-search");
    assertSearchResult(database, { q: "resource-url.example" }, "review_later_resource", "resource-for-search");
    assertSearchResult(database, { q: "search foundation project" }, "project", project.id);
    assertSearchResult(database, { q: "append-only update" }, "project_update", "update-for-search");
  } finally {
    database.close();
  }
});

test("filters search results by status and related project where applicable", () => {
  const database = createTestDatabase();
  try {
    const project = seedSearchRecords(database);
    createTask(
      database,
      taskFixture({
        id: "other-task",
        title: "Electrical task outside project",
        related_project_id: "other-project",
      }),
    );

    const statusResults = searchRecords(database, { q: "electrical task", status: "waiting" });
    assert.equal(statusResults.length, 1);
    assert.equal(statusResults[0].id, "task-for-search");

    const projectResults = searchRecords(database, {
      q: "electrical",
      related_project_id: project.id,
    });
    assert.equal(projectResults.some((result) => result.id === "task-for-search"), true);
    assert.equal(projectResults.some((result) => result.id === "other-task"), false);
  } finally {
    database.close();
  }
});

test("status filters exclude project updates because they do not have statuses", () => {
  const database = createTestDatabase();
  try {
    seedSearchRecords(database);

    const results = searchRecords(database, {
      q: "append-only update",
      status: "active",
    });

    assert.equal(results.some((result) => result.record_type === "project_update"), false);
  } finally {
    database.close();
  }
});

function seedSearchRecords(database) {
  const project = createProject(
    database,
    projectFixture({
      id: "project-for-search",
      name: "Search foundation project",
      status: "active",
      current_phase: "Milestone 7",
      active_reason: "currently being worked on",
    }),
  );

  createRawCapture(
    database,
    rawCaptureFixture({
      id: "capture-for-search",
      raw_text: "Tenant capture search text",
      related_project_id: project.id,
    }),
  );
  createTask(
    database,
    taskFixture({
      id: "task-for-search",
      title: "Electrical task search title",
      status: "waiting",
      related_project_id: project.id,
    }),
  );
  createReviewLaterResource(
    database,
    reviewLaterResourceFixture({
      id: "resource-for-search",
      title: "Search resource",
      url_or_location: "https://resource-url.example/search",
      related_project_id: project.id,
      tags: "search,resource",
    }),
  );
  createProjectUpdate(
    database,
    project.id,
    projectUpdateFixture({
      id: "update-for-search",
      update_text: "Append-only update search text",
    }),
  );

  return project;
}

function assertSearchResult(database, filters, recordType, id) {
  const results = searchRecords(database, filters);
  assert.equal(
    results.some((result) => result.record_type === recordType && result.id === id),
    true,
  );
}

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
