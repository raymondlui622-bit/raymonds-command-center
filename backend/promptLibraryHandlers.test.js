import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handlePromptLibraryItemRequest } from "./promptLibraryHandlers.js";

test("prompt handlers create, list, read, update, favorite, unfavorite, and archive prompts", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/prompts",
      body: {
        title: "Get Back on Track",
        category: "project",
        description: "Summarizes project state",
        full_prompt: "Summarize this project and identify the next action.",
        tags: "project,summary",
      },
    });

    assert.equal(createdResponse.handled, true);
    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.prompt.status, "active");
    assert.equal(createdResponse.body.prompt.is_favorite, 0);

    const id = createdResponse.body.prompt.id;
    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/prompts",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.prompts.length, 1);

    const updateResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/prompts/${id}`,
      body: {
        title: "Project Restart Prompt",
        full_prompt: "Restart this project from the current blockers.",
      },
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.prompt.title, "Project Restart Prompt");

    const favoriteResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/prompts/${id}/favorite`,
      body: { is_favorite: 1 },
    });
    assert.equal(favoriteResponse.statusCode, 200);
    assert.equal(favoriteResponse.body.prompt.is_favorite, 1);
    assert.equal(favoriteResponse.body.prompt.status, "active");

    const unfavoriteResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/prompts/${id}/favorite`,
      body: { is_favorite: 0 },
    });
    assert.equal(unfavoriteResponse.statusCode, 200);
    assert.equal(unfavoriteResponse.body.prompt.is_favorite, 0);

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/prompts/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.prompt.full_prompt, "Restart this project from the current blockers.");

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/prompts/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.prompt.status, "archived");

    const archivedReadResponse = await sendRequest(database, {
      method: "GET",
      url: `/prompts/${id}`,
    });
    assert.equal(archivedReadResponse.statusCode, 200);
    assert.equal(archivedReadResponse.body.prompt.status, "archived");
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

  const handled = await handlePromptLibraryItemRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
