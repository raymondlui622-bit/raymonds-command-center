import {
  archiveProject,
  createProject,
  createProjectUpdate,
  getProjectById,
  listProjectUpdates,
  listProjects,
  updateProject,
} from "./projects.js";

export async function handleProjectRequest(request, response, database) {
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
