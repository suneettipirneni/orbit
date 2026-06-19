import { app } from "electron";
import { join } from "node:path";

export function getDatabasePath() {
  return join(app.getPath("userData"), "orbit.sqlite");
}

export function getMigrationsPath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, "migrations");
  }

  return join(import.meta.dirname, "chunks/migrations");
}

export function getBetterSqliteNativeBindingPath() {
  if (process.env.ORBIT_BETTER_SQLITE3_NATIVE_BINDING) {
    return process.env.ORBIT_BETTER_SQLITE3_NATIVE_BINDING;
  }

  if (app.isPackaged) {
    return join(process.resourcesPath, "native", "better_sqlite3.node");
  }

  return join(
    process.cwd(),
    ".electron-native",
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node",
  );
}
