import type { ApiClient } from "./api-client.js";

export interface Note {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  deckId: string;
  front: string;
  back: string;
}

export interface UpdateNoteInput {
  front?: string;
  back?: string;
}

export function createNote(client: ApiClient, input: CreateNoteInput) {
  return client.post<CreateNoteInput, Note>("/notes", input);
}

export function updateNote(client: ApiClient, noteId: string, input: UpdateNoteInput) {
  return client.patch<UpdateNoteInput, Note>(`/notes/${noteId}`, input);
}

export function deleteNote(client: ApiClient, noteId: string) {
  return client.delete<void>(`/notes/${noteId}`);
}
