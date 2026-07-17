import {
  archiveProject,
  createProject,
  createProjectUpdate,
  getProjectById,
  listProjectUpdates,
  listProjects,
  updateProject,
} from "./projects.js";
import {
  assembleProjectResumeBundle,
  requestProjectResumeNarrative,
} from "./projectResumeSummary.js";
import { getRuntimeOpenAIConfig } from "./classificationService.js";

export async function handleProjectRequest(request, response, database, options = {}) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/projects") {
    writeJson(response, 200, { projects: listProjects(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/projects") {
    const payload = await readJsonBody(request);
    const project = createProject(database, payload);

    writeJson(response, 201, { project });
    return true;
  }

  const updateMatch = url.pathname.match(/^\/projects\/([^/]+)\/updates$/);
  if (updateMatch) {
    const projectId = decodeURIComponent(updateMatch[1]);

    if (request.method === "GET") {
      writeJson(response, 200, { updates: listProjectUpdates(database, projectId) });
      return true;
    }

    if (request.method === "POST") {
      const payload = await readJsonBody(request);
      const update = createProjectUpdate(database, projectId, payload);
      writeJson(response, update ? 201 : 404, update ? { update } : { error: "not_found" });
      return true;
    }
  }

  const resumeSummaryMatch = url.pathname.match(/^\/projects\/([^/]+)\/resume-summary$/);
  if (request.method === "POST" && resumeSummaryMatch) {
    const projectId = decodeURIComponent(resumeSummaryMatch[1]);
    const bundle = assembleProjectResumeBundle(database, projectId);

    if (bundle.error === "not_found") {
      writeJson(response, 404, { error: "not_found" });
      return true;
    }

    if (bundle.error === "project_not_eligible_for_summary") {
      writeJson(response, 409, { error: "project_not_eligible_for_summary" });
      return true;
    }

    const narrativeResult = await requestProjectResumeNarrative(
      bundle,
      options.openAIConfig ?? getRuntimeOpenAIConfig(),
    );

    writeJson(response, 200, {
      project: {
        id: bundle.project.id,
        name: bundle.project.name,
        last_completed_step: bundle.project.last_completed_step,
        current_blocker: bundle.project.current_blocker,
        next_action: bundle.project.next_action,
        waiting_on: bundle.project.waiting_on,
      },
      open_tasks: bundle.openTasks,
      waiting_tasks: bundle.waitingTasks,
      recent_updates: bundle.updates,
      narrative: narrativeResult.narrative,
      narrative_status: narrativeResult.narrative_status,
    });
    return true;
  }

  const match = url.pathname.match(/^\/projects\/([^/]+)(?:\/archive)?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);
  const isArchiveAction = url.pathname.endsWith("/archive");

  if (request.method === "GET" && !isArchiveAction) {
    const project = getProjectById(database, id);
    writeJson(response, project ? 200 : 404, project ? { project } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && !isArchiveAction) {
    const payload = await readJsonBody(request);
    const project = updateProject(database, id, payload);
    writeJson(response, project ? 200 : 404, project ? { project } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && isArchiveAction) {
    const project = archiveProject(database, id);
    writeJson(response, project ? 200 : 404, project ? { project } : { error: "not_found" });
    return true;
  }

  return false;
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Content-Type": "application/json",
  });

  response.end(payload === null ? "" : JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
  }

  if (body === "") {
    return {};
  }

  return JSON.parse(body);
}
