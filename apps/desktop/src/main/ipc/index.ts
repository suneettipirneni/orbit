import { registerDeckIpcHandlers } from "./deck.js";

export interface IpcRuntimeOptions {
  nativeBinding: string;
}

export function registerIpcHandlers(options: IpcRuntimeOptions) {
  registerDeckIpcHandlers(options);
}
