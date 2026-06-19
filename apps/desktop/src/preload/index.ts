import { contextBridge, ipcRenderer } from "electron";
import type { OrbitDesktopApi } from "./api.js";

function invoke<TResponse>(channel: string, ...args: unknown[]) {
  return ipcRenderer.invoke(channel, ...args) as Promise<TResponse>;
}

const api: OrbitDesktopApi = {
  cards: {
    get: (cardId) => invoke("orbit:cards:get", cardId),
    update: (cardId, input) => invoke("orbit:cards:update", cardId, input),
  },
  decks: {
    create: (input) => invoke("orbit:decks:create", input),
    delete: (deckId) => invoke("orbit:decks:delete", deckId),
    get: (deckId) => invoke("orbit:decks:get", deckId),
    importAnki: (input) => invoke("orbit:decks:import-anki", input),
    list: (input) => invoke("orbit:decks:list", input),
    listCardTypes: (deckId, input) => invoke("orbit:decks:list-card-types", deckId, input),
    listCards: (deckId, input) => invoke("orbit:decks:list-cards", deckId, input),
    listNoteTypes: (deckId, input) => invoke("orbit:decks:list-note-types", deckId, input),
    update: (deckId, input) => invoke("orbit:decks:update", deckId, input),
  },
  notes: {
    create: (input) => invoke("orbit:notes:create", input),
    delete: (noteId) => invoke("orbit:notes:delete", noteId),
    update: (noteId, input) => invoke("orbit:notes:update", noteId, input),
  },
  reviews: {
    listDue: (input) => invoke("orbit:reviews:list-due", input),
    submit: (cardId, rating) => invoke("orbit:reviews:submit", cardId, rating),
  },
};

contextBridge.exposeInMainWorld("api", api);
