import { and, asc, eq, sql } from "drizzle-orm";
import type { AnkiPackage } from "@orbit/anki";
import type {
  CardPreview,
  CardType,
  CreateDeckInput,
  Deck,
  DeckDetail,
  DeckSummary,
  DeleteDeckResult,
  ImportAnkiDecksResult,
  NoteType,
  PaginatedResponse,
  PaginationInput,
  UpdateDeckInput,
} from "@orbit/api";
import type { OrbitDatabase } from "../database.js";
import { cardTypes } from "../schemas/card-type.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { noteTypes } from "../schemas/note-type.js";
import { notes } from "../schemas/note.js";
import { normalizePagination, paginatedResponse } from "../pagination.js";
import { parseSearchQuery, translateSearchAst } from "../search/query.js";
import { nowIso } from "../time.js";

interface ListDeckCardsInput extends PaginationInput {
  query?: string;
  searchWithinFormatting?: boolean;
}

export function createDeck(db: OrbitDatabase, input: CreateDeckInput): Deck {
  const timestamp = nowIso();
  const deck = {
    createdAt: timestamp,
    description: input.description ?? null,
    id: crypto.randomUUID(),
    name: input.name,
    updatedAt: timestamp,
  };

  return db.insert(decks).values(deck).returning().get();
}

export function deleteDeck(db: OrbitDatabase, deckId: string): DeleteDeckResult {
  const deletedCards =
    db
      .select({ count: sql<number>`count(*)` })
      .from(cards)
      .where(eq(cards.deckId, deckId))
      .get()?.count ?? 0;

  db.delete(decks).where(eq(decks.id, deckId)).run();

  return { deletedCards };
}

export function getDeck(db: OrbitDatabase, deckId: string): DeckDetail | undefined {
  const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();

  if (!deck) {
    return undefined;
  }

  return {
    counts: getDeckStudyCounts(db, deckId),
    deck,
  };
}

export function listDeckCards(
  db: OrbitDatabase,
  deckId: string,
  input?: ListDeckCardsInput,
): PaginatedResponse<CardPreview> | undefined {
  const deck = db.select({ id: decks.id }).from(decks).where(eq(decks.id, deckId)).get();

  if (!deck) {
    return undefined;
  }

  const pagination = normalizePagination(input);
  const searchFilter = translateSearchAst(parseSearchQuery(input?.query ?? ""));
  const filter = searchFilter
    ? and(eq(cards.deckId, deckId), searchFilter)
    : eq(cards.deckId, deckId);
  const total =
    db
      .select({ count: sql<number>`count(*)` })
      .from(cards)
      .innerJoin(notes, eq(cards.noteId, notes.id))
      .innerJoin(decks, eq(cards.deckId, decks.id))
      .leftJoin(noteTypes, eq(notes.noteTypeId, noteTypes.id))
      .where(filter)
      .get()?.count ?? 0;
  const data = db
    .select({
      ankiCardType: cards.ankiCardType,
      ankiDue: cards.ankiDue,
      ankiFlags: cards.ankiFlags,
      ankiOrder: cards.ankiOrder,
      ankiQueue: cards.ankiQueue,
      ankiSortField: notes.ankiSortField,
      ankiTags: notes.ankiTags,
      ankiType: cards.ankiType,
      back: notes.back,
      cardTypeId: cards.cardTypeId,
      deckId: cards.deckId,
      deckName: decks.name,
      dueAt: cards.dueAt,
      front: notes.front,
      id: cards.id,
      intervalDays: cards.intervalDays,
      noteId: cards.noteId,
      repetitions: cards.repetitions,
    })
    .from(cards)
    .innerJoin(notes, eq(cards.noteId, notes.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .leftJoin(noteTypes, eq(notes.noteTypeId, noteTypes.id))
    .where(filter)
    .orderBy(asc(cards.createdAt), asc(cards.id))
    .limit(pagination.limit)
    .offset(pagination.offset)
    .all();

  return paginatedResponse(data, pagination, total);
}

export function listDeckCardTypes(
  db: OrbitDatabase,
  deckId: string,
  input?: PaginationInput,
): PaginatedResponse<CardType> | undefined {
  const deck = db.select({ id: decks.id }).from(decks).where(eq(decks.id, deckId)).get();

  if (!deck) {
    return undefined;
  }

  const pagination = normalizePagination(input);
  const total =
    db
      .select({ count: sql<number>`count(*)` })
      .from(cardTypes)
      .where(eq(cardTypes.deckId, deckId))
      .get()?.count ?? 0;
  const data = db
    .select({
      ankiOrder: cardTypes.ankiOrder,
      createdAt: cardTypes.createdAt,
      deckId: cardTypes.deckId,
      id: cardTypes.id,
      name: cardTypes.name,
      noteTypeId: cardTypes.noteTypeId,
      noteTypeName: noteTypes.name,
      updatedAt: cardTypes.updatedAt,
    })
    .from(cardTypes)
    .leftJoin(noteTypes, eq(cardTypes.noteTypeId, noteTypes.id))
    .where(eq(cardTypes.deckId, deckId))
    .orderBy(asc(noteTypes.name), asc(cardTypes.ankiOrder), asc(cardTypes.name))
    .limit(pagination.limit)
    .offset(pagination.offset)
    .all();

  return paginatedResponse(data, pagination, total);
}

export function listDeckNoteTypes(
  db: OrbitDatabase,
  deckId: string,
  input?: PaginationInput,
): PaginatedResponse<NoteType> | undefined {
  const deck = db.select({ id: decks.id }).from(decks).where(eq(decks.id, deckId)).get();

  if (!deck) {
    return undefined;
  }

  const pagination = normalizePagination(input);
  const total =
    db
      .select({ count: sql<number>`count(*)` })
      .from(noteTypes)
      .where(eq(noteTypes.deckId, deckId))
      .get()?.count ?? 0;
  const data = db
    .select()
    .from(noteTypes)
    .where(eq(noteTypes.deckId, deckId))
    .orderBy(asc(noteTypes.name), asc(noteTypes.id))
    .limit(pagination.limit)
    .offset(pagination.offset)
    .all();

  return paginatedResponse(data, pagination, total);
}

export function importAnkiDecks(
  db: OrbitDatabase,
  ankiPackage: AnkiPackage,
): ImportAnkiDecksResult {
  return db.transaction((tx) => {
    const importedDecks: Deck[] = [];
    let cardCount = 0;
    let noteCount = 0;

    for (const ankiDeck of ankiPackage.decks) {
      const importableNotes = ankiDeck.notes
        .map((note) => ({ content: extractNoteContent(note.fields), note }))
        .filter((entry) => entry.content && entry.note.cards.length > 0);

      if (importableNotes.length === 0) {
        continue;
      }

      const timestamp = nowIso();
      const deck: Deck = {
        createdAt: timestamp,
        description: "Imported from Anki.",
        id: crypto.randomUUID(),
        name: ankiDeck.name,
        updatedAt: timestamp,
      };

      tx.insert(decks).values(deck).run();
      importedDecks.push(deck);
      const noteTypeIds = new Map<number, string>();
      const cardTypeIds = new Map<string, string>();

      const getNoteTypeId = (note: (typeof importableNotes)[number]["note"]) => {
        const existing = noteTypeIds.get(note.modelId);

        if (existing) {
          return existing;
        }

        const noteTypeId = crypto.randomUUID();
        tx.insert(noteTypes)
          .values({
            ankiId: note.modelId,
            createdAt: timestamp,
            deckId: deck.id,
            fieldNames: note.fieldNames,
            id: noteTypeId,
            name: note.modelName ?? `Note type ${note.modelId}`,
            updatedAt: timestamp,
          })
          .run();
        noteTypeIds.set(note.modelId, noteTypeId);

        return noteTypeId;
      };

      const getCardTypeId = (
        noteTypeId: string,
        ankiCard: (typeof importableNotes)[number]["note"]["cards"][number],
      ) => {
        const name = ankiCard.cardType ?? `Card ${ankiCard.order + 1}`;
        const key = `${noteTypeId}:${ankiCard.order}:${name}`;
        const existing = cardTypeIds.get(key);

        if (existing) {
          return existing;
        }

        const cardTypeId = crypto.randomUUID();
        tx.insert(cardTypes)
          .values({
            ankiOrder: ankiCard.order,
            createdAt: timestamp,
            deckId: deck.id,
            id: cardTypeId,
            name,
            noteTypeId,
            updatedAt: timestamp,
          })
          .run();
        cardTypeIds.set(key, cardTypeId);

        return cardTypeId;
      };

      for (const { content, note } of importableNotes) {
        if (!content) {
          continue;
        }

        const noteId = crypto.randomUUID();
        const noteTypeId = getNoteTypeId(note);
        tx.insert(notes)
          .values({
            ankiChecksum: note.checksum,
            ankiData: note.data,
            ankiFieldNames: note.fieldNames,
            ankiFields: note.fields,
            ankiFlags: note.flags,
            ankiGuid: note.guid,
            ankiId: note.id,
            ankiModelId: note.modelId,
            ankiModifiedAt: note.modifiedAt,
            ankiSortField: note.sortField,
            ankiTags: note.tags,
            ankiUpdateSequenceNumber: note.updateSequenceNumber,
            back: content.back,
            createdAt: timestamp,
            deckId: deck.id,
            front: content.front,
            id: noteId,
            noteTypeId,
            updatedAt: timestamp,
          })
          .run();
        noteCount += 1;

        for (const ankiCard of note.cards) {
          const cardTypeId = getCardTypeId(noteTypeId, ankiCard);
          const cardTypeName = ankiCard.cardType ?? `Card ${ankiCard.order + 1}`;

          tx.insert(cards)
            .values({
              ankiCardType: cardTypeName,
              ankiData: ankiCard.data,
              ankiDeckId: ankiCard.deckId,
              ankiDue: ankiCard.due,
              ankiFactor: ankiCard.factor,
              ankiFlags: ankiCard.flags,
              ankiId: ankiCard.id,
              ankiInterval: ankiCard.interval,
              ankiLapses: ankiCard.lapses,
              ankiLeft: ankiCard.left,
              ankiModifiedAt: ankiCard.modifiedAt,
              ankiNoteId: ankiCard.noteId,
              ankiOrder: ankiCard.order,
              ankiOriginalDeckId: ankiCard.originalDeckId,
              ankiOriginalDue: ankiCard.originalDue,
              ankiQueue: ankiCard.queue,
              ankiRepetitions: ankiCard.repetitions,
              ankiType: ankiCard.type,
              ankiUpdateSequenceNumber: ankiCard.updateSequenceNumber,
              cardTypeId,
              createdAt: timestamp,
              deckId: deck.id,
              dueAt: timestamp,
              easeFactor: ankiCard.factor > 0 ? ankiCard.factor / 1000 : 2.5,
              id: crypto.randomUUID(),
              intervalDays: Math.max(0, ankiCard.interval),
              lapses: Math.max(0, ankiCard.lapses),
              noteId,
              repetitions: Math.max(0, ankiCard.repetitions),
              updatedAt: timestamp,
            })
            .run();
          cardCount += 1;
        }
      }
    }

    return {
      cardCount,
      deckCount: importedDecks.length,
      decks: importedDecks,
      noteCount,
    };
  });
}

export function listDecks(
  db: OrbitDatabase,
  input?: PaginationInput,
): PaginatedResponse<DeckSummary> {
  const pagination = normalizePagination(input);
  const total =
    db
      .select({ count: sql<number>`count(*)` })
      .from(decks)
      .get()?.count ?? 0;
  const data = db
    .select({
      createdAt: decks.createdAt,
      description: decks.description,
      dueCards: countDueCards(),
      id: decks.id,
      learningCards: countLearningCards(),
      name: decks.name,
      newCards: countNewCards(),
      reviewCards: countReviewCards(),
      totalCards: sql<number>`count(${cards.id})`,
      updatedAt: decks.updatedAt,
    })
    .from(decks)
    .leftJoin(cards, eq(decks.id, cards.deckId))
    .groupBy(decks.id)
    .orderBy(asc(decks.createdAt), asc(decks.id))
    .limit(pagination.limit)
    .offset(pagination.offset)
    .all();

  return paginatedResponse(data, pagination, total);
}

export function updateDeck(
  db: OrbitDatabase,
  deckId: string,
  input: UpdateDeckInput,
): Deck | undefined {
  db.update(decks)
    .set({
      ...input,
      updatedAt: nowIso(),
    })
    .where(eq(decks.id, deckId))
    .run();

  return db.select().from(decks).where(eq(decks.id, deckId)).get();
}

function getDeckStudyCounts(db: OrbitDatabase, deckId: string) {
  const result = db
    .select({
      due: countDueCards(),
      learning: countLearningCards(),
      new: countNewCards(),
      review: countReviewCards(),
      total: sql<number>`count(${cards.id})`,
    })
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .get();

  return {
    due: result?.due ?? 0,
    learning: result?.learning ?? 0,
    new: result?.new ?? 0,
    review: result?.review ?? 0,
    total: result?.total ?? 0,
  };
}

function countDueCards() {
  return sql<number>`count(case when ${cards.dueAt} <= ${nowIso()} then 1 end)`;
}

function countNewCards() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, case when ${cards.repetitions} = 0 then 0 else 2 end) = 0 then 1 end)`;
}

function countLearningCards() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, 2) = 1 then 1 end)`;
}

function countReviewCards() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, case when ${cards.repetitions} = 0 then 0 else 2 end) = 2 then 1 end)`;
}

function extractNoteContent(fields: string[]) {
  const front = (fields[0] ?? "").trim();
  const back = fields.slice(1).join("\n\n").trim();

  if (!front && !back) {
    return undefined;
  }

  return {
    back: back || "(empty back)",
    front: front || "(empty front)",
  };
}
