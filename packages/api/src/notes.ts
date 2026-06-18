import type { ApiClient } from "./api-client.js";
import * as z from "zod/v4";

export interface Note {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

export const createNoteInputSchema = z
  .object({
    back: z.string(),
    deckId: z.string(),
    front: z.string(),
  })
  .strict();

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z
  .object({
    back: z.string().optional(),
    front: z.string().optional(),
  })
  .strict();

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

export function createNote(client: ApiClient, input: CreateNoteInput) {
  return client.post<CreateNoteInput, Note>("/notes", input);
}

export function updateNote(client: ApiClient, noteId: string, input: UpdateNoteInput) {
  return client.patch<UpdateNoteInput, Note>(`/notes/${noteId}`, input);
}

export function deleteNote(client: ApiClient, noteId: string) {
  return client.delete<void>(`/notes/${noteId}`);
}
