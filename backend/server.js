import http from "node:http";
import { getHealthPayload } from "./health.js";

const host = "127.0.0.1";
const port = 3001;

const server = http.createServer((request, response) => {
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
