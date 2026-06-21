import { and, eq, isNull } from "drizzle-orm";
import type { CreateNoteInput, Note, UpdateNoteInput } from "@orbit/types";
import { db } from "@/lib/powersync";
import { cards, notes } from "@/lib/powersync-schema";

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const timestamp = nowIso();
  const noteId = crypto.randomUUID();
  const cardId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(notes).values({
      ankiChecksum: null,
      ankiData: null,
      ankiFieldNames: null,
      ankiFields: null,
      ankiFlags: null,
      ankiGuid: null,
      ankiId: null,
      ankiModelId: null,
      ankiModifiedAt: null,
      ankiSortField: null,
      ankiTags: null,
      ankiUpdateSequenceNumber: null,
      back: input.back,
      createdAt: timestamp,
      deckId: input.deckId,
      deletedAt: null,
      front: input.front,
      id: noteId,
      noteTypeId: null,
      updatedAt: timestamp,
    });
    await tx.insert(cards).values({
      cardTypeId: null,
      createdAt: timestamp,
      deckId: input.deckId,
      deletedAt: null,
      dueAt: timestamp,
      easeFactor: 2.5,
      id: cardId,
      intervalDays: 0,
      lapses: 0,
      noteId,
      repetitions: 0,
      updatedAt: timestamp,
    });
  });

  return {
    ankiChecksum: null,
    ankiData: null,
    ankiFieldNames: null,
    ankiFields: null,
    ankiFlags: null,
    ankiGuid: null,
    ankiId: null,
    ankiModelId: null,
    ankiModifiedAt: null,
    ankiSortField: null,
    ankiTags: null,
    ankiUpdateSequenceNumber: null,
    back: input.back,
    createdAt: timestamp,
    deckId: input.deckId,
    front: input.front,
    id: noteId,
    noteTypeId: null,
    updatedAt: timestamp,
  };
}

export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note> {
  const note = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), isNull(notes.deletedAt)))
    .get();

  if (!note) {
    throw new Error("Note not found.");
  }

  const timestamp = nowIso();
  const tags = updateTags(note.ankiTags, input);

  await db.transaction(async (tx) => {
    await tx
      .update(notes)
      .set({
        ankiTags: tags,
        back: input.back ?? note.back,
        front: input.front ?? note.front,
        updatedAt: timestamp,
      })
      .where(eq(notes.id, noteId));

    if (input.buried || input.suspended) {
      await tx
        .update(cards)
        .set({
          ankiQueue: input.suspended ? -1 : -2,
          updatedAt: timestamp,
        })
        .where(and(eq(cards.noteId, noteId), isNull(cards.deletedAt)));
    }
  });

  return {
    ...note,
    ankiTags: tags,
    back: input.back ?? note.back,
    front: input.front ?? note.front,
    updatedAt: timestamp,
  };
}

export async function deleteNote(noteId: string): Promise<void> {
  const timestamp = nowIso();

  await db.transaction(async (tx) => {
    await tx
      .update(notes)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(notes.id, noteId));
    await tx
      .update(cards)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(cards.noteId, noteId));
  });
}

function updateTags(currentTags: string[] | null, input: UpdateNoteInput) {
  const tags = new Set((currentTags ?? []).map((tag) => tag.trim()).filter(Boolean));

  for (const tag of input.addTags ?? []) {
    const normalized = tag.trim();

    if (normalized) {
      tags.add(normalized);
    }
  }

  for (const tag of input.removeTags ?? []) {
    tags.delete(tag.trim());
  }

  if (input.marked === true) {
    tags.add("marked");
  } else if (input.marked === false) {
    tags.delete("marked");
  }

  return Array.from(tags);
}

function nowIso() {
  return new Date().toISOString();
}
