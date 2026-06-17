import { app } from "electron";
import { join } from "node:path";

export function getDatabasePath() {
  return join(app.getPath("userData"), "orbit.sqlite");
}
