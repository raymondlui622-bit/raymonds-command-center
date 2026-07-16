import test from "node:test";
import assert from "node:assert/strict";
import { getHealthPayload } from "./health.js";

test("health payload reports SQLite connection", () => {
  const payload = getHealthPayload();

  assert.equal(payload.ok, true);
  assert.equal(payload.service, "raymond-command-center");
  assert.equal(payload.sqlite, "connected");
});
