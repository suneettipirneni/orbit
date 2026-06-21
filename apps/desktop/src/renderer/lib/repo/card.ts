import { and, eq, isNull } from "drizzle-orm";
import type { CardWithNote, UpdateCardInput } from "@orbit/types";
import { db } from "@/lib/powersync";
import { cards, decks, notes } from "@/lib/powersync-schema";

export async function getCard(cardId: string): Promise<CardWithNote | undefined> {
  const row = await db
    .select(cardWithNoteSelection())
    .from(cards)
    .innerJoin(notes, eq(notes.id, cards.noteId))
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(and(eq(cards.id, cardId), activeCardFilter()))
    .get();

  return row;
}

export async function updateCard(cardId: string, input: UpdateCardInput): Promise<CardWithNote> {
  const card = await getCard(cardId);

  if (!card) {
    throw new Error("Card not found.");
  }

  const timestamp = nowIso();

  await db
    .update(cards)
    .set({
      ankiDue: input.position ?? card.ankiDue,
      ankiFlags:
        input.flag === undefined ? card.ankiFlags : setUserFlag(card.ankiFlags, input.flag),
      ankiOrder: input.position ?? card.ankiOrder,
      ankiQueue: nextQueue(card, input),
      ankiType: input.forget ? 0 : card.ankiType,
      deckId: input.deckId ?? card.deckId,
      dueAt: input.forget ? timestamp : (input.dueAt ?? card.dueAt),
      intervalDays: input.forget ? 0 : card.intervalDays,
      lapses: input.forget ? 0 : card.lapses,
      repetitions: input.forget ? 0 : card.repetitions,
      updatedAt: timestamp,
    })
    .where(and(eq(cards.id, cardId), isNull(cards.deletedAt)));

  const updated = await getCard(cardId);

  if (!updated) {
    throw new Error("Card not found after update.");
  }

  return updated;
}

function nextQueue(card: CardWithNote, input: UpdateCardInput) {
  if (input.forget) {
    return 0;
  }

  if (input.buried) {
    return -2;
  }

  if (input.suspended === undefined) {
    return card.ankiQueue;
  }

  return input.suspended ? -1 : restoreQueue(card);
}

function restoreQueue(card: CardWithNote) {
  if (card.ankiType === 0 || card.ankiType === 1 || card.ankiType === 2) {
    return card.ankiType;
  }

  return card.repetitions === 0 ? 0 : 2;
}

function setUserFlag(flags: number | null, flag: number) {
  return ((flags ?? 0) & ~7) | flag;
}

function cardWithNoteSelection() {
  return {
    ankiCardType: cards.ankiCardType,
    ankiData: cards.ankiData,
    ankiDeckId: cards.ankiDeckId,
    ankiDue: cards.ankiDue,
    ankiFactor: cards.ankiFactor,
    ankiFlags: cards.ankiFlags,
    ankiId: cards.ankiId,
    ankiInterval: cards.ankiInterval,
    ankiLapses: cards.ankiLapses,
    ankiLeft: cards.ankiLeft,
    ankiModifiedAt: cards.ankiModifiedAt,
    ankiNoteId: cards.ankiNoteId,
    ankiOrder: cards.ankiOrder,
    ankiOriginalDeckId: cards.ankiOriginalDeckId,
    ankiOriginalDue: cards.ankiOriginalDue,
    ankiQueue: cards.ankiQueue,
    ankiRepetitions: cards.ankiRepetitions,
    ankiSortField: notes.ankiSortField,
    ankiTags: notes.ankiTags,
    ankiType: cards.ankiType,
    ankiUpdateSequenceNumber: cards.ankiUpdateSequenceNumber,
    back: notes.back,
    cardTypeId: cards.cardTypeId,
    createdAt: cards.createdAt,
    deckId: cards.deckId,
    deckName: decks.name,
    dueAt: cards.dueAt,
    easeFactor: cards.easeFactor,
    front: notes.front,
    id: cards.id,
    intervalDays: cards.intervalDays,
    lapses: cards.lapses,
    noteId: cards.noteId,
    repetitions: cards.repetitions,
    updatedAt: cards.updatedAt,
  };
}

function activeCardFilter() {
  return and(isNull(cards.deletedAt), isNull(notes.deletedAt), isNull(decks.deletedAt));
}

function nowIso() {
  return new Date().toISOString();
}
