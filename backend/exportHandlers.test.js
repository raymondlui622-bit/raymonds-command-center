import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleExportRequest } from "./exportHandlers.js";
import { createRawCapture } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";

test("export handler returns JSON download", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    createRawCapture(database, rawCaptureFixture({ id: "json-export-capture" }));

    const response = await sendRequest(database, {
      method: "GET",
      url: "/export.json",
    });

    assert.equal(response.handled, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["Content-Type"], "application/json; charset=utf-8");
    assert.match(
      response.headers["Content-Disposition"],
      /^attachment; filename="raymond-command-center-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    assert.equal(response.json.data.raw_captures[0].id, "json-export-capture");
  } finally {
    database.close();
  }
});

test("export handler returns Markdown download", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    createRawCapture(database, rawCaptureFixture({ id: "markdown-export-capture" }));

    const response = await sendRequest(database, {
      method: "GET",
      url: "/export.md",
    });

    assert.equal(response.handled, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["Content-Type"], "text/markdown; charset=utf-8");
    assert.match(
      response.headers["Content-Disposition"],
      /^attachment; filename="raymond-command-center-export-\d{4}-\d{2}-\d{2}\.md"$/,
    );
    assert.match(response.body, /# Raymond Command Center Export/);
    assert.match(response.body, /markdown-export-capture/);
  } finally {
    database.close();
  }
});

test("export handler ignores unrelated routes", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const response = await sendRequest(database, {
      method: "GET",
      url: "/not-export",
    });

    assert.equal(response.handled, false);
    assert.equal(response.statusCode, null);
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
    headers: null,
    statusCode: null,
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = "") {
      this.body += chunk;
    },
  };

  const handled = await handleExportRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
    json: response.headers?.["Content-Type"]?.startsWith("application/json")
      ? JSON.parse(response.body)
      : null,
  };
}
