import {
  callOpenAIResponsesApi,
  extractOpenAIOutputText,
  getRuntimeOpenAIConfig,
} from "./classificationService.js";
import { getProjectById, listProjectUpdates } from "./projects.js";
import { listTasksForProject } from "./tasks.js";

const ineligibleStatuses = Object.freeze(["completed", "archived"]);
const recentUpdatesLimit = 3;

export function assembleProjectResumeBundle(database, projectId) {
  const project = getProjectById(database, projectId);
  if (!project) {
    return { error: "not_found" };
  }

  if (ineligibleStatuses.includes(project.status)) {
    return { error: "project_not_eligible_for_summary" };
  }

  return {
    project,
    openTasks: listTasksForProject(database, projectId, ["open"]),
    waitingTasks: listTasksForProject(database, projectId, ["waiting"]),
    updates: listProjectUpdates(database, projectId).slice(0, recentUpdatesLimit),
  };
}

export async function requestProjectResumeNarrative(bundle, config = getRuntimeOpenAIConfig()) {
  if (!config) {
    return { narrative: null, narrative_status: "unavailable" };
  }

  try {
    const payload = await callOpenAIResponsesApi({
      ...config,
      requestBody: buildNarrativeRequest(bundle, config.model),
    });

    return { narrative: parseNarrativeResponse(payload), narrative_status: "available" };
  } catch {
    return { narrative: null, narrative_status: "error" };
  }
}

function buildNarrativeRequest(bundle, model) {
  const { project, openTasks, waitingTasks, updates } = bundle;

  return {
    model,
    input: [
      {
        role: "system",
        content:
          "Write one short, practical narrative paragraph helping Raymond resume this project. " +
          "Use only the provided project fields, its linked open tasks, its linked waiting tasks, " +
          "and its latest updates. Do not invent facts, dates, or next steps not present in the input.",
      },
      {
        role: "user",
        content: JSON.stringify({
          project: {
            name: project.name,
            last_completed_step: project.last_completed_step,
            current_blocker: project.current_blocker,
            next_action: project.next_action,
            waiting_on: project.waiting_on,
          },
          open_tasks: openTasks.map((task) => ({
            title: task.title,
            next_action: task.next_action,
          })),
          waiting_tasks: waitingTasks.map((task) => ({
            title: task.title,
            waiting_on: task.waiting_on,
          })),
          recent_updates: updates.map((update) => ({
            update_text: update.update_text,
            update_type: update.update_type,
          })),
        }),
      },
    ],
    max_output_tokens: 300,
    text: {
      format: {
        type: "json_schema",
        name: "project_resume_narrative",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["narrative"],
          properties: {
            narrative: { type: "string" },
          },
        },
      },
    },
  };
}

function parseNarrativeResponse(payload) {
  const outputText = extractOpenAIOutputText(payload);
  if (!outputText) {
    throw new Error("project_resume_narrative_invalid");
  }

  const parsed = JSON.parse(outputText);
  if (typeof parsed.narrative !== "string" || parsed.narrative.trim() === "") {
    throw new Error("project_resume_narrative_invalid");
  }

  return parsed.narrative;
}
