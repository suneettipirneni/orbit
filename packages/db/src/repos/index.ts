import type { DatabaseHandle } from "../database.js";
import { createCardRepo, type CardRepo } from "./card.js";
import { createDeckRepo, type DeckRepo } from "./deck.js";
import { createNoteRepo, type NoteRepo } from "./note.js";

export interface Repositories extends CardRepo, DeckRepo, NoteRepo {}

export function createRepositories(handle: DatabaseHandle): Repositories {
  const context = { handle };

  return {
    ...createCardRepo(context),
    ...createDeckRepo(context),
    ...createNoteRepo(context),
  };
}
