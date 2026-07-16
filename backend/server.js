import http from "node:http";
import { getDatabase } from "./db.js";
import { getHealthPayload } from "./health.js";
import { handleRawCaptureRequest } from "./rawCaptureHandlers.js";
import { handleTaskRequest } from "./taskHandlers.js";

const host = "127.0.0.1";
const port = 3001;
const database = getDatabase();

const server = http.createServer(async (request, response) => {
  try {
    const handled = await handleRawCaptureRequest(request, response, database);
    if (handled) {
      return;
    }

    const taskHandled = await handleTaskRequest(request, response, database);
    if (taskHandled) {
      return;
    }
  } catch (error) {
    response.writeHead(400, {
      "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ ok: false, error: error.message }));
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    const payload = getHealthPayload();
    response.writeHead(payload.ok ? 200 : 500, {
      "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(payload));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: false, error: "not_found" }));
});

server.listen(port, host, () => {
  console.log(`Backend listening at http://${host}:${port}`);
});
