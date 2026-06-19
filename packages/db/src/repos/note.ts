import { eq } from "drizzle-orm";
import type { CreateNoteInput, Note, UpdateNoteInput } from "@orbit/api";
import type { RepoContext } from "./context.js";
import { cards } from "../schemas/card.js";
import { notes } from "../schemas/note.js";
import { nowIso } from "../time.js";

export interface NoteRepo {
  createNote(input: CreateNoteInput): Note;
  deleteNote(noteId: string): void;
  getNote(noteId: string): Note | undefined;
  updateNote(noteId: string, input: UpdateNoteInput): Note | undefined;
}

export function createNoteRepo({ handle }: RepoContext): NoteRepo {
  const { db } = handle;

  return {
    createNote(input) {
      const timestamp = nowIso();
      const note = {
        back: input.back,
        createdAt: timestamp,
        deckId: input.deckId,
        front: input.front,
        id: crypto.randomUUID(),
        updatedAt: timestamp,
      };

      db.insert(notes).values(note).run();
      db.insert(cards)
        .values({
          createdAt: timestamp,
          deckId: input.deckId,
          dueAt: timestamp,
          easeFactor: 2.5,
          id: crypto.randomUUID(),
          intervalDays: 0,
          lapses: 0,
          noteId: note.id,
          repetitions: 0,
          updatedAt: timestamp,
        })
        .run();

      const created = db.select().from(notes).where(eq(notes.id, note.id)).get();

      if (!created) {
        throw new Error("Failed to create note.");
      }

      return created;
    },
    deleteNote(noteId) {
      db.delete(notes).where(eq(notes.id, noteId)).run();
    },
    getNote(noteId) {
      return db.select().from(notes).where(eq(notes.id, noteId)).get();
    },
    updateNote(noteId, input) {
      const note = db.select().from(notes).where(eq(notes.id, noteId)).get();

      if (!note) {
        return undefined;
      }

      const ankiTags = updateTags(note.ankiTags, input);

      db.update(notes)
        .set({
          ankiTags,
          back: input.back ?? note.back,
          front: input.front ?? note.front,
          updatedAt: nowIso(),
        })
        .where(eq(notes.id, noteId))
        .run();

      return db.select().from(notes).where(eq(notes.id, noteId)).get();
    },
  };
}

function normalizeTag(tag: string) {
  return tag.trim();
}

function updateTags(currentTags: string[] | null, input: UpdateNoteInput) {
  const tags = new Set((currentTags ?? []).map(normalizeTag).filter(Boolean));

  for (const tag of input.addTags ?? []) {
    const normalized = normalizeTag(tag);

    if (normalized) {
      tags.add(normalized);
    }
  }

  for (const tag of input.removeTags ?? []) {
    tags.delete(normalizeTag(tag));
  }

  if (input.marked === true) {
    tags.add("marked");
  } else if (input.marked === false) {
    tags.delete("marked");
  }

  return Array.from(tags);
}
