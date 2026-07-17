import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  PROJECT_STATUSES,
  archiveProject,
  createProject,
  createProjectUpdate,
  getProjectById,
  listProjectUpdates,
  updateProject,
} from "./projects.js";
import { projectFixture, projectUpdateFixture } from "./projects.fixture.js";
import { createReviewLaterResource, updateReviewLaterResource } from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";
import { createTask, updateTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("creates and reads a project with approved simplified statuses", () => {
  const database = createTestDatabase();
  try {
    const created = createProject(database, projectFixture());
    const stored = getProjectById(database, created.id);

    assert.equal(stored.id, created.id);
    assert.equal(stored.name, "Raymond Command Center");
    assert.equal(stored.status, "active");
    assert.equal(stored.current_phase, "Phase 3 implementation");
    assert.equal(stored.active_reason, "currently being worked on");
    assert.deepEqual(PROJECT_STATUSES, [
      "active",
      "blocked",
      "waiting",
      "paused",
      "completed",
      "archived",
    ]);
  } finally {
    database.close();
  }
});

test("calculates due_soon without storing it", () => {
  const database = createTestDatabase();
  try {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10)
      .toISOString()
      .slice(0, 10);
    const created = createProject(database, projectFixture({ due_date: dueDate }));
    const columns = database.prepare("PRAGMA table_info(projects)").all().map((column) => column.name);

    assert.equal(created.due_soon, 1);
    assert.equal(columns.includes("due_soon"), false);
  } finally {
    database.close();
  }
});

test("project updates are append-only while current project fields change", () => {
  const database = createTestDatabase();
  try {
    const project = createProject(database, projectFixture());
    const firstUpdate = createProjectUpdate(
      database,
      project.id,
      projectUpdateFixture({
        id: "first-update",
        update_text: "Initial blocker recorded.",
        created_at: "2026-07-16T10:00:00.000Z",
      }),
    );

    const updatedProject = updateProject(database, project.id, {
      current_blocker: "Waiting on Raymond review",
      next_action: "Review Milestone 6",
    });
    const secondUpdate = createProjectUpdate(
      database,
      project.id,
      projectUpdateFixture({
        id: "second-update",
        update_text: "Current blocker changed after implementation.",
        created_at: "2026-07-16T11:00:00.000Z",
      }),
    );
    const updates = listProjectUpdates(database, project.id);

    assert.equal(updatedProject.current_blocker, "Waiting on Raymond review");
    assert.equal(firstUpdate.update_text, "Initial blocker recorded.");
    assert.equal(secondUpdate.update_text, "Current blocker changed after implementation.");
    assert.equal(updates.length, 2);
    assert.equal(updates.some((update) => update.update_text === "Initial blocker recorded."), true);
  } finally {
    database.close();
  }
});

test("tasks and review later resources can link to one primary project", () => {
  const database = createTestDatabase();
  try {
    const project = createProject(database, projectFixture());
    const task = createTask(database, taskFixture());
    const resource = createReviewLaterResource(database, reviewLaterResourceFixture());

    const linkedTask = updateTask(database, task.id, { related_project_id: project.id });
    const linkedResource = updateReviewLaterResource(database, resource.id, {
      related_project_id: project.id,
    });

    assert.equal(linkedTask.related_project_id, project.id);
    assert.equal(linkedResource.related_project_id, project.id);
  } finally {
    database.close();
  }
});

test("archives a project while keeping it retrievable", () => {
  const database = createTestDatabase();
  try {
    const project = createProject(database, projectFixture());
    const archived = archiveProject(database, project.id, "2026-07-16T15:00:00.000Z");
    const stored = getProjectById(database, project.id);

    assert.equal(archived.status, "archived");
    assert.equal(archived.archived_at, "2026-07-16T15:00:00.000Z");
    assert.equal(stored.status, "archived");
  } finally {
    database.close();
  }
});

test("database initialization creates only approved module tables through milestone 9", () => {
  const database = createTestDatabase();
  try {
    const tables = database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `)
      .all()
      .map((row) => row.name);

    assert.deepEqual(tables, [
      "arsenal_items",
      "project_updates",
      "projects",
      "prompt_library_items",
      "raw_captures",
      "review_later_resources",
      "tasks",
    ]);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
