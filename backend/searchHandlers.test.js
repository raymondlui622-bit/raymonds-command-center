import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";
import { handleSearchRequest } from "./searchHandlers.js";

test("search handler returns keyword search results", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    createTask(database, taskFixture({ id: "handler-task", title: "Handler search task" }));

    const response = await sendRequest(database, {
      method: "GET",
      url: "/search?q=handler",
    });

    assert.equal(response.handled, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.results.length, 1);
    assert.equal(response.body.results[0].id, "handler-task");
  } finally {
    database.close();
  }
});

test("search handler rejects unknown record types", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const response = await sendRequest(database, {
      method: "GET",
      url: "/search?record_type=morning_brief",
    });

    assert.equal(response.handled, true);
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, "invalid_record_type");
  } finally {
    database.close();
  }
});

async function sendRequest(database, { method, url }) {
  const request = Readable.from([]);
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

  const handled = await handleSearchRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
