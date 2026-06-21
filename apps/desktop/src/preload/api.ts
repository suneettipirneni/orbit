import type { AnkiPackage } from "@orbit/anki";

export interface IpcLoadAnkiPackageInput {
  data: ArrayBuffer;
  fileName: string;
}

export interface OrbitDesktopApi {
  decks: {
    loadAnkiPackage(input: IpcLoadAnkiPackageInput): Promise<AnkiPackage>;
  };
}

declare global {
  interface Window {
    api: OrbitDesktopApi;
  }
}
