import { app } from "electron";
import { join } from "node:path";

export function getBetterSqliteNativeBindingPath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, "native", "better_sqlite3.node");
  }

  return join(import.meta.dirname, "../native/better_sqlite3.node");
}
