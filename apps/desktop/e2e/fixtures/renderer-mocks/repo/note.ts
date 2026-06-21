import type { CreateNoteInput, UpdateNoteInput } from "@orbit/types";
import { getApi } from "../api";

export function createNote(input: CreateNoteInput) {
  return getApi().notes.create(input);
}

export function updateNote(noteId: string, input: UpdateNoteInput) {
  return getApi().notes.update(noteId, input);
}

export function deleteNote(noteId: string) {
  return getApi().notes.delete(noteId);
}
