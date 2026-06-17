import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { createDatabase } from "./lib/database.js";
import { getDatabasePath } from "./lib/app-paths.js";
import { createRepositories } from "./lib/repos/index.js";
import { startApiServer, type ApiServer } from "./lib/server.js";

let apiServer: ApiServer | undefined;

async function createWindow() {
  const window = new BrowserWindow({
    height: 820,
    minHeight: 640,
    minWidth: 960,
    show: false,
    title: "Orbit",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    width: 1180,
  });

  window.once("ready-to-show", () => window.show());

  const rendererUrl = process.env.ORBIT_RENDERER_URL;

  if (rendererUrl) {
    await window.loadURL(rendererUrl);
  } else {
    await window.loadFile(join(app.getAppPath(), "../web/dist/index.html"));
  }
}

void app
  .whenReady()
  .then(async () => {
    const database = createDatabase(getDatabasePath());
    const repositories = createRepositories(database);
    apiServer = startApiServer(repositories);

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
