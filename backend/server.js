import http from "node:http";
import { handleArsenalItemRequest } from "./arsenalHandlers.js";
import { handleClassificationRequest } from "./classificationHandlers.js";
import { getDatabase } from "./db.js";
import { handleMorningBriefRequest } from "./morningBriefHandlers.js";
import { handleExportRequest } from "./exportHandlers.js";
import { getHealthPayload } from "./health.js";
import { handleProjectRequest } from "./projectHandlers.js";
import { handlePromptLibraryItemRequest } from "./promptLibraryHandlers.js";
import { handleRawCaptureRequest } from "./rawCaptureHandlers.js";
import { handleReviewLaterResourceRequest } from "./reviewLaterHandlers.js";
import { handleSearchRequest } from "./searchHandlers.js";
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

    const reviewLaterHandled = await handleReviewLaterResourceRequest(request, response, database);
    if (reviewLaterHandled) {
      return;
    }

    const projectHandled = await handleProjectRequest(request, response, database);
    if (projectHandled) {
      return;
    }

    const arsenalHandled = await handleArsenalItemRequest(request, response, database);
    if (arsenalHandled) {
      return;
    }

    const promptLibraryHandled = await handlePromptLibraryItemRequest(request, response, database);
    if (promptLibraryHandled) {
      return;
    }

    const classificationHandled = await handleClassificationRequest(request, response, database);
    if (classificationHandled) {
      return;
    }

    const morningBriefHandled = await handleMorningBriefRequest(request, response, database);
    if (morningBriefHandled) {
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

  const searchHandled = await handleSearchRequest(request, response, database);
  if (searchHandled) {
    return;
  }

  const exportHandled = await handleExportRequest(request, response, database);
  if (exportHandled) {
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
