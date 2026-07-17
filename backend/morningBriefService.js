import { randomUUID } from "node:crypto";
import {
  callOpenAIResponsesApi,
  extractOpenAIOutputText,
  getRuntimeOpenAIConfig,
} from "./classificationService.js";

const importanceBySection = Object.freeze({
  requires_raymond: "high",
  needs_verification: "medium",
  waiting_on_others: "medium",
  fyi: "low",
});

export function assembleMorningBrief(database) {
  const generatedAt = new Date().toISOString();
  const briefBatchId = randomUUID();
  const briefDate = generatedAt.slice(0, 10);

  const rawItems = [
    ...buildRequiresRaymondItems(database),
    ...buildNeedsVerificationItems(database),
    ...buildWaitingOnOthersItems(database),
    ...buildFyiItems(database),
  ];

  const items = rawItems.map((item) => ({
    ...item,
    id: randomUUID(),
    brief_batch_id: briefBatchId,
    brief_date: briefDate,
    generated_at: generatedAt,
    confidence: 1.0,
    importance: importanceBySection[item.section],
    ai_narrative: null,
    review_status: "proposed",
    corrected_note: null,
  }));

  return { briefBatchId, briefDate, generatedAt, items };
}

function buildRequiresRaymondItems(database) {
  const tasks = database
    .prepare(`
      SELECT * FROM tasks
      WHERE requires_raymond = 1 AND status IN ('open', 'in_progress', 'blocked')
      ORDER BY created_at DESC, id DESC
    `)
    .all();

  const projects = database
    .prepare(`
      SELECT * FROM projects
      WHERE requires_raymond = 1 AND status IN ('active', 'blocked', 'waiting', 'paused')
      ORDER BY created_at DESC, id DESC
    `)
    .all();

  return [
    ...tasks.map((task) => ({
      section: "requires_raymond",
      title: task.title,
      summary: task.description ?? task.title,
      reason: "Task is marked as requiring Raymond's attention.",
      source_refs: [{ record_type: "task", id: task.id }],
      suggested_action: task.next_action ?? "Review and decide.",
    })),
    ...projects.map((project) => ({
      section: "requires_raymond",
      title: project.name,
      summary: project.active_reason ?? project.current_phase,
      reason: "Project is marked as requiring Raymond's attention.",
      source_refs: [{ record_type: "project", id: project.id }],
      suggested_action: project.next_action ?? "Review and decide.",
    })),
  ];
}

function buildWaitingOnOthersItems(database) {
  const tasks = database
    .prepare(`SELECT * FROM tasks WHERE status = 'waiting' ORDER BY created_at DESC, id DESC`)
    .all();

  return tasks.map((task) => ({
    section: "waiting_on_others",
    title: task.title,
    summary: task.waiting_on ? `Waiting on ${task.waiting_on}` : "Waiting on a follow-up.",
    reason: "Task is marked waiting.",
    source_refs: [{ record_type: "task", id: task.id }],
    suggested_action: task.next_action ?? "Follow up.",
  }));
}

function buildFyiItems(database) {
  const resources = database
    .prepare(`
      SELECT * FROM review_later_resources
      WHERE status IN ('new', 'reviewing', 'useful', 'reference')
      ORDER BY saved_at DESC, id DESC
    `)
    .all();

  return resources.map((resource) => ({
    section: "fyi",
    title: resource.title,
    summary: resource.why_it_matters,
    reason: "Saved resource not yet actioned.",
    source_refs: [{ record_type: "review_later_resource", id: resource.id }],
    suggested_action: "Read when convenient.",
  }));
}

function buildNeedsVerificationItems(database) {
  const captures = database
    .prepare(`
      SELECT * FROM raw_captures
      WHERE status IN ('new', 'proposed')
        AND (related_project_id IS NULL OR suggested_type IS NULL)
      ORDER BY captured_at DESC, id DESC
    `)
    .all();

  return captures.map((capture) => ({
    section: "needs_verification",
    title: capture.title ?? capture.raw_text.slice(0, 80),
    summary: capture.raw_text,
    reason: "Capture is unresolved and missing project or type information.",
    source_refs: [{ record_type: "raw_capture", id: capture.id }],
    suggested_action: "Clarify or classify.",
  }));
}

export async function requestMorningBriefNarrative(items, config = getRuntimeOpenAIConfig()) {
  if (!config) {
    return { items, ai_status: "unavailable" };
  }

  try {
    const payload = await callOpenAIResponsesApi({
      ...config,
      requestBody: buildNarrativeRequest(items, config.model),
    });

    const narratives = parseNarrativeResponse(payload, items.length);
    return {
      items: items.map((item, index) => ({ ...item, ai_narrative: narratives[index] })),
      ai_status: "available",
    };
  } catch {
    return { items, ai_status: "error" };
  }
}

function buildNarrativeRequest(items, model) {
  return {
    model,
    input: [
      {
        role: "system",
        content:
          "For each Morning Brief item given, in the same order, write one short practical narrative " +
          "sentence explaining it. Do not add, remove, or reorder items. Do not invent facts not present " +
          "in the input.",
      },
      {
        role: "user",
        content: JSON.stringify(
          items.map((item) => ({
            section: item.section,
            title: item.title,
            summary: item.summary,
            reason: item.reason,
          })),
        ),
      },
    ],
    max_output_tokens: 800,
    text: {
      format: {
        type: "json_schema",
        name: "morning_brief_narratives",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["narratives"],
          properties: {
            narratives: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["narrative"],
                properties: { narrative: { type: "string" } },
              },
            },
          },
        },
      },
    },
  };
}

function parseNarrativeResponse(payload, expectedCount) {
  const outputText = extractOpenAIOutputText(payload);
  if (!outputText) {
    throw new Error("morning_brief_narrative_invalid");
  }

  const parsed = JSON.parse(outputText);
  if (!Array.isArray(parsed.narratives) || parsed.narratives.length !== expectedCount) {
    throw new Error("morning_brief_narrative_invalid");
  }

  return parsed.narratives.map((entry) => {
    if (typeof entry.narrative !== "string" || entry.narrative.trim() === "") {
      throw new Error("morning_brief_narrative_invalid");
    }
    return entry.narrative;
  });
}
