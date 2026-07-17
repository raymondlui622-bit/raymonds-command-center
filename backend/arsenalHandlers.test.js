import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleArsenalItemRequest } from "./arsenalHandlers.js";

test("arsenal handlers create, list, read, update, and archive items", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/arsenal",
      body: {
        name: "Prompt Master",
        category: "skill",
        description: "Improves reusable prompts",
        url: "https://example.com/prompt-master",
        tags: "prompt,skill",
        notes: "Use for reusable prompt cleanup",
      },
    });

    assert.equal(createdResponse.handled, true);
    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.item.status, "active");

    const id = createdResponse.body.item.id;
    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/arsenal",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.items.length, 1);

    const updateResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/arsenal/${id}`,
      body: {
        name: "Prompt Master Skill",
        category: "workflow",
      },
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.item.name, "Prompt Master Skill");

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/arsenal/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.item.category, "workflow");

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/arsenal/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.item.status, "archived");

    const archivedReadResponse = await sendRequest(database, {
      method: "GET",
      url: `/arsenal/${id}`,
    });
    assert.equal(archivedReadResponse.statusCode, 200);
    assert.equal(archivedReadResponse.body.item.status, "archived");
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

  const handled = await handleArsenalItemRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
