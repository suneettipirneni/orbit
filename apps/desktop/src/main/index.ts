import { app, BrowserWindow } from "electron";
import { createDatabase, createRepositories, type DatabaseHandle } from "@orbit/db";
import { join } from "node:path";
import {
  getBetterSqliteNativeBindingPath,
  getDatabasePath,
  getMigrationsPath,
} from "./lib/app-paths.js";
import { registerIpcHandlers } from "./ipc/index.js";

let database: DatabaseHandle | undefined;

async function createWindow() {
  const window = new BrowserWindow({
    height: 820,
    minHeight: 640,
    minWidth: 960,
    show: false,
    title: "Orbit",
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hidden" as const,
          trafficLightPosition: { x: 16, y: 18 },
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(import.meta.dirname, "../preload/index.js"),
    },
    width: 1180,
  });

  window.once("ready-to-show", () => window.show());

  const rendererUrl = process.env.ELECTRON_RENDERER_URL ?? process.env.ORBIT_RENDERER_URL;

  if (!app.isPackaged && rendererUrl) {
    await window.loadURL(rendererUrl);
  } else {
    await window.loadFile(join(import.meta.dirname, "../renderer/index.html"));
  }
}

void app
  .whenReady()
  .then(async () => {
    const nativeBinding = getBetterSqliteNativeBindingPath();
    process.env.ORBIT_BETTER_SQLITE3_NATIVE_BINDING = nativeBinding;

    database = createDatabase(getDatabasePath(), {
      migrationsFolder: getMigrationsPath(),
      nativeBinding,
    });
    registerIpcHandlers(createRepositories(database));

    await createWindow();
  })
  .catch((error: unknown) => {
    console.error(error);
    app.quit();
  });

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.on("before-quit", () => {
  database?.sqlite.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
