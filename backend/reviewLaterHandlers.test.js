import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleReviewLaterResourceRequest } from "./reviewLaterHandlers.js";

test("review later handlers create, list, read, update, and archive resources", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/review-later",
      body: {
        title: "Useful GitHub repository",
        resource_type: "github_repository",
        url_or_location: "https://github.com/example/repo",
        why_it_matters: "Potential reference for local-first architecture choices",
      },
    });

    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.resource.status, "new");

    const id = createdResponse.body.resource.id;
    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/review-later",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.resources.length, 1);

    const updateResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/review-later/${id}`,
      body: {
        status: "reference",
        related_project_id: "future-project-id",
        possible_use: "Use when projects exist",
      },
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.resource.status, "reference");
    assert.equal(updateResponse.body.resource.related_project_id, "future-project-id");

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/review-later/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.resource.title, "Useful GitHub repository");

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/review-later/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.resource.status, "archived");

    const archivedReadResponse = await sendRequest(database, {
      method: "GET",
      url: `/review-later/${id}`,
    });
    assert.equal(archivedReadResponse.statusCode, 200);
    assert.equal(archivedReadResponse.body.resource.status, "archived");
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

  const handled = await handleReviewLaterResourceRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
