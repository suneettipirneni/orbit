import type { OrbitDatabase } from "@orbit/db";
import { registerCardIpcHandlers } from "./card.js";
import { registerDeckIpcHandlers } from "./deck.js";
import { registerNoteIpcHandlers } from "./note.js";
import { registerReviewIpcHandlers } from "./review.js";

export interface IpcRuntimeOptions {
  nativeBinding: string;
}

export function registerIpcHandlers(db: OrbitDatabase, options: IpcRuntimeOptions) {
  registerDeckIpcHandlers(db, options);
  registerCardIpcHandlers(db);
  registerNoteIpcHandlers(db);
  registerReviewIpcHandlers(db);
}
