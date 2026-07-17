import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleProjectRequest } from "./projectHandlers.js";
import { createProject, listProjectUpdates } from "./projects.js";
import { projectFixture } from "./projects.fixture.js";
import { createTask, listTasks } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("project handlers create, list, read, update, archive, and append updates", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/projects",
      body: {
        name: "Raymond Command Center",
        current_phase: "Phase 3 implementation",
        priority: "high",
        active_reason: "currently being worked on",
      },
    });

    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.project.status, "active");

    const id = createdResponse.body.project.id;
    const firstUpdateResponse = await sendRequest(database, {
      method: "POST",
      url: `/projects/${id}/updates`,
      body: {
        update_text: "Initial project update.",
        update_type: "progress",
      },
    });
    assert.equal(firstUpdateResponse.statusCode, 201);

    const updateProjectResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/projects/${id}`,
      body: {
        current_blocker: "Waiting on review",
        next_action: "Review Milestone 6",
      },
    });
    assert.equal(updateProjectResponse.statusCode, 200);
    assert.equal(updateProjectResponse.body.project.current_blocker, "Waiting on review");

    const secondUpdateResponse = await sendRequest(database, {
      method: "POST",
      url: `/projects/${id}/updates`,
      body: {
        update_text: "Second project update.",
        update_type: "progress",
      },
    });
    assert.equal(secondUpdateResponse.statusCode, 201);

    const listUpdatesResponse = await sendRequest(database, {
      method: "GET",
      url: `/projects/${id}/updates`,
    });
    assert.equal(listUpdatesResponse.statusCode, 200);
    assert.equal(listUpdatesResponse.body.updates.length, 2);
    assert.equal(
      listUpdatesResponse.body.updates.some(
        (update) => update.update_text === "Initial project update.",
      ),
      true,
    );

    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/projects",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.projects.length, 1);

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/projects/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.project.name, "Raymond Command Center");

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/projects/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.project.status, "archived");
  } finally {
    database.close();
  }
});

test("resume-summary returns deterministic bundle with unavailable narrative and no key configured", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const project = createProject(database, projectFixture({ id: "project-active" }));
    createTask(database, taskFixture({ id: "task-open-1", status: "open", related_project_id: project.id }));
    createTask(database, taskFixture({ id: "task-waiting-1", status: "waiting", related_project_id: project.id }));

    const response = await sendRequest(database, {
      method: "POST",
      url: `/projects/${project.id}/resume-summary`,
      openAIConfig: null,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.project.id, project.id);
    assert.equal(response.body.open_tasks.length, 1);
    assert.equal(response.body.waiting_tasks.length, 1);
    assert.equal(response.body.narrative, null);
    assert.equal(response.body.narrative_status, "unavailable");
  } finally {
    database.close();
  }
});

test("resume-summary returns narrative when the provider succeeds", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const project = createProject(database, projectFixture({ id: "project-active" }));

    const response = await sendRequest(database, {
      method: "POST",
      url: `/projects/${project.id}/resume-summary`,
      openAIConfig: {
        apiKey: "test-key",
        model: "gpt-5-mini",
        fetchImpl: async () =>
          jsonResponse({
            output_text: JSON.stringify({ narrative: "Pick up Milestone 6 review next." }),
          }),
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.narrative_status, "available");
    assert.equal(response.body.narrative, "Pick up Milestone 6 review next.");
  } finally {
    database.close();
  }
});

test("resume-summary keeps deterministic data on provider timeout, 4xx, 5xx, and malformed output", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const project = createProject(database, projectFixture({ id: "project-active" }));
    const failingConfigs = [
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({}, { ok: false, status: 401 }) },
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }) },
      {
        apiKey: "test-key",
        timeoutMs: 1,
        fetchImpl: (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      },
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({ output_text: "not json" }) },
    ];

    for (const openAIConfig of failingConfigs) {
      const response = await sendRequest(database, {
        method: "POST",
        url: `/projects/${project.id}/resume-summary`,
        openAIConfig,
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.narrative, null);
      assert.equal(response.body.narrative_status, "error");
      assert.equal(response.body.project.id, project.id);
    }
  } finally {
    database.close();
  }
});

test("resume-summary rejects completed and archived projects and never calls the provider", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const completed = createProject(database, projectFixture({ id: "project-completed", status: "completed" }));
    const archived = createProject(database, projectFixture({ id: "project-archived", status: "archived" }));
    let providerCalled = false;
    const openAIConfig = {
      apiKey: "test-key",
      fetchImpl: async () => {
        providerCalled = true;
        return jsonResponse({ output_text: JSON.stringify({ narrative: "Should not run." }) });
      },
    };

    const completedResponse = await sendRequest(database, {
      method: "POST",
      url: `/projects/${completed.id}/resume-summary`,
      openAIConfig,
    });
    const archivedResponse = await sendRequest(database, {
      method: "POST",
      url: `/projects/${archived.id}/resume-summary`,
      openAIConfig,
    });

    assert.equal(completedResponse.statusCode, 409);
    assert.deepEqual(completedResponse.body, { error: "project_not_eligible_for_summary" });
    assert.equal(archivedResponse.statusCode, 409);
    assert.deepEqual(archivedResponse.body, { error: "project_not_eligible_for_summary" });
    assert.equal(providerCalled, false);
  } finally {
    database.close();
  }
});

test("resume-summary returns 404 for a missing project", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const response = await sendRequest(database, {
      method: "POST",
      url: "/projects/missing-project/resume-summary",
      openAIConfig: null,
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { error: "not_found" });
  } finally {
    database.close();
  }
});

test("resume-summary filters tasks strictly by related_project_id with no cross-project leakage", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const projectA = createProject(database, projectFixture({ id: "project-a" }));
    const projectB = createProject(database, projectFixture({ id: "project-b", name: "Project B" }));
    createTask(database, taskFixture({ id: "task-a-open", status: "open", related_project_id: projectA.id }));
    createTask(database, taskFixture({ id: "task-b-open", status: "open", related_project_id: projectB.id }));

    const response = await sendRequest(database, {
      method: "POST",
      url: `/projects/${projectA.id}/resume-summary`,
      openAIConfig: null,
    });

    assert.equal(response.body.open_tasks.length, 1);
    assert.equal(response.body.open_tasks[0].id, "task-a-open");
  } finally {
    database.close();
  }
});

test("resume-summary never mutates projects, tasks, or project_updates tables", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const project = createProject(database, projectFixture({ id: "project-active" }));
    createTask(database, taskFixture({ id: "task-open-1", status: "open", related_project_id: project.id }));

    const beforeTasks = listTasks(database);
    const beforeUpdates = listProjectUpdates(database, project.id);
    const beforeProject = { ...project };

    await sendRequest(database, {
      method: "POST",
      url: `/projects/${project.id}/resume-summary`,
      openAIConfig: {
        apiKey: "test-key",
        fetchImpl: async () =>
          jsonResponse({ output_text: JSON.stringify({ narrative: "Narrative text." }) }),
      },
    });

    const afterTasks = listTasks(database);
    const afterUpdates = listProjectUpdates(database, project.id);
    const afterProject = { ...(await sendRequest(database, { method: "GET", url: `/projects/${project.id}` })).body.project };

    assert.deepEqual(afterTasks, beforeTasks);
    assert.deepEqual(afterUpdates, beforeUpdates);
    assert.deepEqual(afterProject, beforeProject);
  } finally {
    database.close();
  }
});

function jsonResponse(payload, overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    async json() {
      return payload;
    },
  };
}

async function sendRequest(database, { method, url, body, openAIConfig }) {
  const request = Readable.from(body ? [JSON.stringify(body)] : []);
  request.method = method;
  request.url = url;

  const response = {
    body: "",
    statusCode: null,
    writeHead(statusCode) {
      this.statusCode = statusCode;
    },
    end(chunk = "") {
      this.body += chunk;
    },
  };

  const handled = await handleProjectRequest(request, response, database, { openAIConfig });

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
