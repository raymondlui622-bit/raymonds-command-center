import test from "node:test";
import assert from "node:assert/strict";
import {
  ClassificationProviderUnavailableError,
  normalizeAcceptedClassification,
  normalizeClassificationSuggestion,
  requestClassificationSuggestion,
} from "./classificationService.js";

const rawCapture = {
  id: "capture-1",
  raw_text: "Follow up with electrician about Cory exterior lighting",
};

test("returns deterministic mocked Task suggestions through the provider boundary", async () => {
  const suggestion = await requestClassificationSuggestion(rawCapture, {
    async classifyRawCapture(input) {
      assert.deepEqual(input, {
        id: "capture-1",
        raw_text: "Follow up with electrician about Cory exterior lighting",
      });
      return {
        acceptance_id: "accept-task-1",
        proposed_record_type: "task",
        reasoning: "The capture describes a follow-up action.",
        confidence: 0.87,
        values: {
          title: "Follow up with electrician",
          priority: "medium",
          next_action: "Ask about Cory exterior lighting",
        },
      };
    },
  });

  assert.equal(suggestion.acceptance_id, "accept-task-1");
  assert.equal(suggestion.raw_capture_id, "capture-1");
  assert.equal(suggestion.proposed_record_type, "task");
  assert.equal(suggestion.values.title, "Follow up with electrician");
});

test("normalizes valid Review Later suggestions", () => {
  const suggestion = normalizeClassificationSuggestion(
    {
      acceptance_id: "accept-resource-1",
      proposed_record_type: "review_later_resource",
      reasoning: "The capture is a resource to review.",
      confidence: "medium",
      values: {
        title: "Lighting reference",
        resource_type: "note",
        why_it_matters: "May help with exterior lighting planning",
      },
    },
    "capture-2",
  );

  assert.equal(suggestion.proposed_record_type, "review_later_resource");
  assert.equal(suggestion.values.resource_type, "note");
  assert.deepEqual(Object.keys(suggestion.values), [
    "title",
    "resource_type",
    "why_it_matters",
  ]);
});

test("rejects malformed AI responses safely", () => {
  assert.throws(
    () =>
      normalizeClassificationSuggestion(
        {
          proposed_record_type: "project",
          reasoning: "Not supported in Milestone 10.",
          confidence: 0.4,
          values: { name: "Project" },
        },
        "capture-1",
      ),
    /classification_suggestion_invalid_record_type/,
  );

  assert.throws(
    () =>
      normalizeClassificationSuggestion(
        {
          proposed_record_type: "task",
          reasoning: "",
          confidence: 0.4,
          values: { title: "Task" },
        },
        "capture-1",
      ),
    /reasoning is required/,
  );
});

test("reports provider unavailable when no runtime provider is configured", async () => {
  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, null),
    ClassificationProviderUnavailableError,
  );
});

test("normalizes edited accepted suggestions before record creation", () => {
  const accepted = normalizeAcceptedClassification(
    {
      acceptance_id: "accept-edited-1",
      proposed_record_type: "task",
      values: {
        title: "Edited task title",
        priority: "high",
      },
    },
    "capture-1",
  );

  assert.equal(accepted.values.title, "Edited task title");
  assert.equal(accepted.values.priority, "high");
  assert.equal(accepted.raw_capture_id, "capture-1");
});
