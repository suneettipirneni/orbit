import { ipcMain } from "electron";
import { isAnkiPackagePath, loadAnkiPackage } from "@orbit/anki";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { IpcLoadAnkiPackageInput } from "../../preload/api.js";
import type { IpcRuntimeOptions } from "./index.js";

export function registerDeckIpcHandlers(options: IpcRuntimeOptions) {
  ipcMain.handle("orbit:decks:load-anki-package", (_event, input: IpcLoadAnkiPackageInput) =>
    loadUploadedAnkiPackage(input, options),
  );
}

function loadUploadedAnkiPackage(input: IpcLoadAnkiPackageInput, options: IpcRuntimeOptions) {
  if (!isSupportedAnkiFileName(input.fileName)) {
    throw new Error("Unsupported Anki file format. Use .apkg, .colpkg, .anki2, or .anki21.");
  }

  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-upload-"));
  const filePath = join(workdir, `import${extname(input.fileName).toLowerCase()}`);

  try {
    writeFileSync(filePath, Buffer.from(input.data));

    if (!isAnkiPackagePath(filePath)) {
      throw new Error("Uploaded file is not a supported Anki deck format.");
    }

    return loadAnkiPackage(filePath, { nativeBinding: options.nativeBinding });
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
}

function isSupportedAnkiFileName(fileName: string) {
  return [".apkg", ".colpkg", ".anki2", ".anki21"].includes(extname(fileName).toLowerCase());
}
