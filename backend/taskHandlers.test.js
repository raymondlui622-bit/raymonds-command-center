import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleTaskRequest } from "./taskHandlers.js";

test("task handlers create, list, read, update, complete, and archive tasks", async () => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);

  try {
    const createdResponse = await sendRequest(database, {
      method: "POST",
      url: "/tasks",
      body: {
        title: "Confirm electrician visit",
        priority: "medium",
      },
    });

    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.task.status, "open");

    const id = createdResponse.body.task.id;
    const listResponse = await sendRequest(database, {
      method: "GET",
      url: "/tasks",
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.tasks.length, 1);

    const updateResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/tasks/${id}`,
      body: {
        title: "Confirm electrician visit window",
        status: "waiting",
        waiting_on: "Electrician",
        follow_up_date: "2026-07-18",
        last_contacted_at: "2026-07-16",
        next_action: "Follow up if not confirmed",
      },
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.task.status, "waiting");
    assert.equal(updateResponse.body.task.waiting_on, "Electrician");

    const readResponse = await sendRequest(database, {
      method: "GET",
      url: `/tasks/${id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    assert.equal(readResponse.body.task.title, "Confirm electrician visit window");

    const completeResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/tasks/${id}/complete`,
    });
    assert.equal(completeResponse.statusCode, 200);
    assert.equal(completeResponse.body.task.status, "done");

    const archiveResponse = await sendRequest(database, {
      method: "PATCH",
      url: `/tasks/${id}/archive`,
    });
    assert.equal(archiveResponse.statusCode, 200);
    assert.equal(archiveResponse.body.task.status, "archived");

    const archivedReadResponse = await sendRequest(database, {
      method: "GET",
      url: `/tasks/${id}`,
    });
    assert.equal(archivedReadResponse.statusCode, 200);
    assert.equal(archivedReadResponse.body.task.status, "archived");
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

  const handled = await handleTaskRequest(request, response, database);

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
