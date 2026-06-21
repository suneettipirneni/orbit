import { contextBridge, ipcRenderer } from "electron";
import type { OrbitDesktopApi } from "./api.js";

function invoke<TResponse>(channel: string, ...args: unknown[]) {
  return ipcRenderer.invoke(channel, ...args) as Promise<TResponse>;
}

const api: OrbitDesktopApi = {
  decks: {
    loadAnkiPackage: (input) => invoke("orbit:decks:load-anki-package", input),
  },
};

contextBridge.exposeInMainWorld("api", api);
