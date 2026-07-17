import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  assembleProjectResumeBundle,
  requestProjectResumeNarrative,
} from "./projectResumeSummary.js";
import { createProject, createProjectUpdate } from "./projects.js";
import { projectFixture, projectUpdateFixture } from "./projects.fixture.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("assembles deterministic bundle from project fields, linked tasks, and latest three updates", () => {
  const database = createTestDatabase();
  try {
    const project = createProject(database, projectFixture({ id: "project-1" }));
    const otherProject = createProject(database, projectFixture({ id: "project-2", name: "Other" }));

    createTask(database, taskFixture({ id: "task-open-1", status: "open", related_project_id: project.id }));
    createTask(database, taskFixture({ id: "task-waiting-1", status: "waiting", related_project_id: project.id }));
    createTask(database, taskFixture({ id: "task-done-1", status: "done", related_project_id: project.id }));
    createTask(database, taskFixture({ id: "task-other-open", status: "open", related_project_id: otherProject.id }));

    for (let index = 1; index <= 4; index += 1) {
      createProjectUpdate(
        database,
        project.id,
        projectUpdateFixture({ id: `update-${index}`, update_text: `Update ${index}` }),
      );
    }

    const bundle = assembleProjectResumeBundle(database, project.id);

    assert.equal(bundle.project.id, project.id);
    assert.equal(bundle.openTasks.length, 1);
    assert.equal(bundle.openTasks[0].id, "task-open-1");
    assert.equal(bundle.waitingTasks.length, 1);
    assert.equal(bundle.waitingTasks[0].id, "task-waiting-1");
    assert.equal(bundle.updates.length, 3);
    assert.equal(
      bundle.updates.every((update) => update.project_id === project.id),
      true,
    );
  } finally {
    database.close();
  }
});

test("rejects completed and archived projects as ineligible", () => {
  const database = createTestDatabase();
  try {
    const completed = createProject(
      database,
      projectFixture({ id: "project-completed", status: "completed" }),
    );
    const archived = createProject(
      database,
      projectFixture({ id: "project-archived", status: "archived" }),
    );

    assert.equal(
      assembleProjectResumeBundle(database, completed.id).error,
      "project_not_eligible_for_summary",
    );
    assert.equal(
      assembleProjectResumeBundle(database, archived.id).error,
      "project_not_eligible_for_summary",
    );
  } finally {
    database.close();
  }
});

test("returns not_found for a missing project", () => {
  const database = createTestDatabase();
  try {
    assert.equal(assembleProjectResumeBundle(database, "missing").error, "not_found");
  } finally {
    database.close();
  }
});

test("narrative is unavailable with no provider config and never calls fetch", async () => {
  const result = await requestProjectResumeNarrative(minimalBundle(), null);
  assert.deepEqual(result, { narrative: null, narrative_status: "unavailable" });
});

test("narrative sends only the selected project's fields, tasks, and updates", async () => {
  const requests = [];
  const result = await requestProjectResumeNarrative(minimalBundle(), {
    apiKey: "test-key",
    model: "gpt-5-mini",
    timeoutMs: 15000,
    fetchImpl: async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return jsonResponse({
        output_text: JSON.stringify({ narrative: "Pick up the electrician follow-up next." }),
      });
    },
  });

  const bodyText = JSON.stringify(requests[0].body);
  // M13-003 regression: budget below 500 starves gpt-5-mini reasoning output.
  assert.equal(requests[0].body.max_output_tokens, 500);
  assert.equal(result.narrative_status, "available");
  assert.equal(result.narrative, "Pick up the electrician follow-up next.");
  assert.equal(bodyText.includes("Command Center"), true);
  assert.equal(bodyText.includes("project-1"), false);
  assert.equal(bodyText.includes("task-open-1"), false);
  assert.equal(bodyText.includes("update-1"), false);
});

test("narrative failure, timeout, and malformed output all resolve to error status without throwing", async () => {
  const errorResult = await requestProjectResumeNarrative(minimalBundle(), {
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }),
  });
  assert.deepEqual(errorResult, { narrative: null, narrative_status: "error" });

  const timeoutResult = await requestProjectResumeNarrative(minimalBundle(), {
    apiKey: "test-key",
    timeoutMs: 1,
    fetchImpl: (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  });
  assert.deepEqual(timeoutResult, { narrative: null, narrative_status: "error" });

  const malformedResult = await requestProjectResumeNarrative(minimalBundle(), {
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse({ output_text: JSON.stringify({ narrative: "" }) }),
  });
  assert.deepEqual(malformedResult, { narrative: null, narrative_status: "error" });
});

function minimalBundle() {
  return {
    project: {
      id: "project-1",
      name: "Raymond Command Center",
      last_completed_step: "Milestone 5 approved",
      current_blocker: "Milestone 6 implementation",
      next_action: "Add Projects and Project Updates",
      waiting_on: null,
    },
    openTasks: [{ id: "task-open-1", title: "Confirm electrician visit", next_action: "Call electrician" }],
    waitingTasks: [],
    updates: [{ id: "update-1", update_text: "Milestone 6 project tracking added.", update_type: "progress" }],
  };
}

function jsonResponse(payload, overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    async json() {
      return payload;
    },
  };
}

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
