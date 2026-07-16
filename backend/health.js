import { checkSqliteConnection } from "./db.js";

export function getHealthPayload() {
  const sqlite = checkSqliteConnection();

  return {
    ok: sqlite.ok,
    service: "raymond-command-center",
    sqlite: sqlite.ok ? "connected" : "unavailable",
  };
}
