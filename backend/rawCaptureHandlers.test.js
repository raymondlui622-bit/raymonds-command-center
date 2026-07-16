import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleRawCaptureRequest } from "./rawCaptureHandlers.js";

test("raw capture handlers create, list, read, and archive captures", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/raw-captures",
      body: { raw_text: "Call electrician about exterior lighting" },
    });

    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.capture.raw_text, "Call electrician about exterior lighting");
    assert.equal(createdResponse.body.capture.status, "new");

    const id = createdResponse.body.capture.id;
    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/raw-captures",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.captures.length, 1);

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/raw-captures/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.capture.id, id);

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/raw-captures/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.capture.status, "archived");

    const archivedReadResponse = await sendRequest(database, {
      method: "GET",
      url: `/raw-captures/${id}`,
    });
    assert.equal(archivedReadResponse.statusCode, 200);
    assert.equal(archivedReadResponse.body.capture.status, "archived");
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

  const handled = await handleRawCaptureRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
