import type { ApiClient } from "./api-client.js";
import * as z from "zod/v4";

export interface Note {
  ankiChecksum: number | null;
  ankiData: string | null;
  ankiFieldNames: string[] | null;
  ankiFields: string[] | null;
  ankiFlags: number | null;
  ankiGuid: string | null;
  ankiId: number | null;
  ankiModelId: number | null;
  ankiModifiedAt: number | null;
  ankiSortField: string | null;
  ankiTags: string[] | null;
  ankiUpdateSequenceNumber: number | null;
  id: string;
  deckId: string;
  noteTypeId: string | null;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

const usableNoteFieldSchema = z.string().refine((value) => value.trim().length > 0);
const noteTagSchema = z.string();

export const createNoteInputSchema = z
  .object({
    back: usableNoteFieldSchema,
    deckId: z.string(),
    front: usableNoteFieldSchema,
  })
  .strict();

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z
  .object({
    addTags: z.array(noteTagSchema).optional(),
    back: z.string().optional(),
    buried: z.boolean().optional(),
    front: z.string().optional(),
    marked: z.boolean().optional(),
    removeTags: z.array(noteTagSchema).optional(),
    suspended: z.boolean().optional(),
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
