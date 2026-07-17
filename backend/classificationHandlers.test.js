import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleClassificationRequest } from "./classificationHandlers.js";
import { createRawCapture, getRawCaptureById } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";
import { listReviewLaterResources } from "./reviewLaterResources.js";
import { listTasks } from "./tasks.js";

test("classification handlers request Task suggestion, accept edited values once, and preserve raw capture", async () => {
  const database = createTestDatabase();
  try {
    const capture = createRawCapture(database, rawCaptureFixture({ id: "capture-task" }));
    const original = getRawCaptureById(database, capture.id);
    const provider = mockProvider({
      acceptance_id: "accept-task-once",
      proposed_record_type: "task",
      reasoning: "This is an action Raymond needs to track.",
      confidence: 0.9,
      values: {
        title: "Follow up with electrician",
        priority: "medium",
      },
    });

    const suggestionResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion`,
      provider,
    });

    assert.equal(suggestionResponse.statusCode, 200);
    assert.equal(suggestionResponse.body.suggestion.proposed_record_type, "task");

    const editedSuggestion = {
      ...suggestionResponse.body.suggestion,
      values: {
        ...suggestionResponse.body.suggestion.values,
        title: "Edited electrician follow-up",
        priority: "high",
      },
    };

    const firstAcceptResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion/accept`,
      body: editedSuggestion,
    });
    const secondAcceptResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion/accept`,
      body: editedSuggestion,
    });

    assert.equal(firstAcceptResponse.statusCode, 201);
    assert.equal(secondAcceptResponse.statusCode, 200);
    assert.equal(firstAcceptResponse.body.created, true);
    assert.equal(secondAcceptResponse.body.created, false);
    assert.equal(listTasks(database).length, 1);
    assert.equal(listTasks(database)[0].title, "Edited electrician follow-up");
    assert.equal(listTasks(database)[0].source_capture_id, capture.id);
    assert.deepEqual(getRawCaptureById(database, capture.id), original);
  } finally {
    database.close();
  }
});

test("classification handlers accept valid Review Later suggestions", async () => {
  const database = createTestDatabase();
  try {
    const capture = createRawCapture(database, rawCaptureFixture({ id: "capture-resource" }));
    const provider = mockProvider({
      acceptance_id: "accept-resource-once",
      proposed_record_type: "review_later_resource",
      reasoning: "This is a saved resource.",
      confidence: "high",
      values: {
        title: "Exterior lighting article",
        resource_type: "article",
        why_it_matters: "May help plan the lighting work",
      },
    });

    const suggestionResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion`,
      provider,
    });
    const acceptResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion/accept`,
      body: suggestionResponse.body.suggestion,
    });

    assert.equal(acceptResponse.statusCode, 201);
    assert.equal(acceptResponse.body.record_type, "review_later_resource");
    assert.equal(listReviewLaterResources(database).length, 1);
    assert.equal(listReviewLaterResources(database)[0].source_capture_id, capture.id);
  } finally {
    database.close();
  }
});

test("classification handlers fail safely for malformed AI responses and unavailable provider", async () => {
  const database = createTestDatabase();
  try {
    const capture = createRawCapture(database, rawCaptureFixture({ id: "capture-bad-ai" }));
    const malformedResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion`,
      provider: mockProvider({ proposed_record_type: "task", confidence: 0.7, values: {} }),
    });
    const unavailableResponse = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion`,
    });

    assert.equal(malformedResponse.statusCode, 422);
    assert.equal(unavailableResponse.statusCode, 503);
    assert.equal(listTasks(database).length, 0);
    assert.equal(listReviewLaterResources(database).length, 0);
  } finally {
    database.close();
  }
});

test("classification rejection creates no records and preserves the raw capture", async () => {
  const database = createTestDatabase();
  try {
    const capture = createRawCapture(database, rawCaptureFixture({ id: "capture-reject" }));
    const original = getRawCaptureById(database, capture.id);
    const response = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-suggestion/reject`,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.rejected, true);
    assert.equal(listTasks(database).length, 0);
    assert.equal(listReviewLaterResources(database).length, 0);
    assert.deepEqual(getRawCaptureById(database, capture.id), original);
  } finally {
    database.close();
  }
});

test("classification handlers record corrections without changing source records", async () => {
  const database = createTestDatabase();
  try {
    const capture = createRawCapture(database, rawCaptureFixture({ id: "capture-correction" }));
    const original = getRawCaptureById(database, capture.id);
    const response = await sendRequest(database, {
      method: "POST",
      url: `/raw-captures/${capture.id}/classification-corrections`,
      body: {
        suggested_record_type: "task",
        corrected_record_type: "review_later_resource",
        original_suggestion: { proposed_record_type: "task" },
        corrected_values: { title: "Corrected resource" },
        correction_note: "Resource, not task.",
      },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.correction.raw_capture_id, capture.id);
    assert.equal(getRawCaptureById(database, capture.id).raw_text, original.raw_text);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}

function mockProvider(suggestion) {
  return {
    async classifyRawCapture() {
      return suggestion;
    },
  };
}

async function sendRequest(database, { method, url, body, provider }) {
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

  const handled = await handleClassificationRequest(request, response, database, { provider });

  return {
    handled,
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
