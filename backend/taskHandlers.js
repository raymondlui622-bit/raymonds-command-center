import {
  archiveTask,
  completeTask,
  createTask,
  getTaskById,
  listTasks,
  updateTask,
} from "./tasks.js";

export async function handleTaskRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/tasks") {
    writeJson(response, 200, { tasks: listTasks(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/tasks") {
    const payload = await readJsonBody(request);
    const task = createTask(database, payload);

    writeJson(response, 201, { task });
    return true;
  }

  const match = url.pathname.match(/^\/tasks\/([^/]+)(?:\/(complete|archive))?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);
  const action = match[2];

  if (request.method === "GET" && !action) {
    const task = getTaskById(database, id);
    writeJson(response, task ? 200 : 404, task ? { task } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && !action) {
    const payload = await readJsonBody(request);
    const task = updateTask(database, id, payload);
    writeJson(response, task ? 200 : 404, task ? { task } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && action === "complete") {
    const task = completeTask(database, id);
    writeJson(response, task ? 200 : 404, task ? { task } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && action === "archive") {
    const task = archiveTask(database, id);
    writeJson(response, task ? 200 : 404, task ? { task } : { error: "not_found" });
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
