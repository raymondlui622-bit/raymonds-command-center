import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleProjectRequest } from "./projectHandlers.js";

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

async function sendRequest(database, { method, url, body }) {
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

  const handled = await handleProjectRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
