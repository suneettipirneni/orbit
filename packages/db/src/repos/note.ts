import { eq } from "drizzle-orm";
import type { CreateNoteInput, Note, UpdateNoteInput } from "@orbit/api";
import type { OrbitDatabase } from "../database.js";
import { cards } from "../schemas/card.js";
import { notes } from "../schemas/note.js";
import { nowIso } from "../time.js";

export function createNote(db: OrbitDatabase, input: CreateNoteInput): Note {
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
}

export function deleteNote(db: OrbitDatabase, noteId: string): void {
  db.delete(notes).where(eq(notes.id, noteId)).run();
}

export function getNote(db: OrbitDatabase, noteId: string): Note | undefined {
  return db.select().from(notes).where(eq(notes.id, noteId)).get();
}

export function updateNote(
  db: OrbitDatabase,
  noteId: string,
  input: UpdateNoteInput,
): Note | undefined {
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

  if (input.buried || input.suspended) {
    db.update(cards)
      .set({
        ankiQueue: input.suspended ? -1 : -2,
        updatedAt: nowIso(),
      })
      .where(eq(cards.noteId, noteId))
      .run();
  }

  return db.select().from(notes).where(eq(notes.id, noteId)).get();
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
