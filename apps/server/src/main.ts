import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createDatabase } from "./lib/database.js";
import { createRepositories } from "./lib/repos/index.js";
import { startApiServer } from "./lib/server.js";

const databasePath =
  process.env.ORBIT_DATABASE_PATH ?? join(process.cwd(), ".orbit", "orbit.sqlite");
const port = getPort(process.env.ORBIT_API_PORT);

mkdirSync(dirname(databasePath), { recursive: true });

const database = createDatabase(databasePath);
const apiServer = startApiServer(createRepositories(database), port);

console.log(`Orbit API listening on http://127.0.0.1:${apiServer.port}`);

function shutdown() {
  apiServer.close();
  database.sqlite.close();
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

function getPort(value: string | undefined) {
  if (value === undefined) {
    return 3737;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid ORBIT_API_PORT: ${value}`);
  }

  return parsed;
}
