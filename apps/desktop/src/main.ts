import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import type { ApiServer } from "@orbit/server";
import { getDatabasePath } from "./lib/app-paths.js";

let apiServer: ApiServer | undefined;

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
    if (process.env.ORBIT_EMBEDDED_API !== "0") {
      apiServer = await startEmbeddedApiServer();
    }

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
  apiServer?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

async function startEmbeddedApiServer() {
  const { createDatabase, createRepositories, startApiServer } = await import("@orbit/server");
  const database = createDatabase(getDatabasePath());
  const repositories = createRepositories(database);

  return startApiServer(repositories);
}
