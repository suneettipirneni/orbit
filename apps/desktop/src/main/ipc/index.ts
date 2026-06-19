import type { Repositories } from "@orbit/db";
import { registerCardIpcHandlers } from "./card.js";
import { registerDeckIpcHandlers } from "./deck.js";
import { registerNoteIpcHandlers } from "./note.js";
import { registerReviewIpcHandlers } from "./review.js";

export function registerIpcHandlers(repositories: Repositories) {
  registerDeckIpcHandlers(repositories);
  registerCardIpcHandlers(repositories);
  registerNoteIpcHandlers(repositories);
  registerReviewIpcHandlers(repositories);
}
