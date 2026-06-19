import { and, asc, eq, sql } from "drizzle-orm";
import type { AnkiPackage } from "@orbit/anki";
import type {
  CreateDeckInput,
  CardType,
  Deck,
  DeckDetail,
  DeckSummary,
  CardPreview,
  DeleteDeckResult,
  ImportAnkiDecksResult,
  NoteType,
  PaginatedResponse,
  PaginationInput,
  UpdateDeckInput,
} from "@orbit/api";
import { cardTypes } from "../schemas/card-type.js";
import type { RepoContext } from "./context.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { noteTypes } from "../schemas/note-type.js";
import { notes } from "../schemas/note.js";
import { normalizePagination, paginatedResponse } from "../pagination.js";
import { parseSearchQuery, translateSearchAst } from "../search/query.js";
import { nowIso } from "../time.js";

interface ListDeckCardsInput extends PaginationInput {
  query?: string;
}

export interface DeckRepo {
  createDeck(input: CreateDeckInput): Deck;
  deleteDeck(deckId: string): DeleteDeckResult;
  getDeck(deckId: string): DeckDetail | undefined;
  importAnkiDecks(ankiPackage: AnkiPackage): ImportAnkiDecksResult;
  listDeckCards(
    deckId: string,
    input?: ListDeckCardsInput,
  ): PaginatedResponse<CardPreview> | undefined;
  listDeckCardTypes(
    deckId: string,
    input?: PaginationInput,
  ): PaginatedResponse<CardType> | undefined;
  listDeckNoteTypes(
    deckId: string,
    input?: PaginationInput,
  ): PaginatedResponse<NoteType> | undefined;
  listDecks(input?: PaginationInput): PaginatedResponse<DeckSummary>;
  updateDeck(deckId: string, input: UpdateDeckInput): Deck | undefined;
}

export function createDeckRepo({ handle }: RepoContext): DeckRepo {
  const { db, sqlite } = handle;

  return {
    createDeck(input) {
      const timestamp = nowIso();
      const deck = {
        createdAt: timestamp,
        description: input.description ?? null,
        id: crypto.randomUUID(),
        name: input.name,
        updatedAt: timestamp,
      };

      return db.insert(decks).values(deck).returning().get();
    },
    deleteDeck(deckId) {
      const deletedCards =
        db
          .select({ count: sql<number>`count(*)` })
          .from(cards)
          .where(eq(cards.deckId, deckId))
          .get()?.count ?? 0;

      db.delete(decks).where(eq(decks.id, deckId)).run();

      return { deletedCards };
    },
    getDeck(deckId) {
      const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();

      if (!deck) {
        return undefined;
      }

      return {
        counts: getDeckStudyCounts(deckId),
        deck,
      };
    },
    listDeckCards(deckId, input) {
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
          repetitions: cards.repetitions,
          noteId: cards.noteId,
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
    },
    listDeckCardTypes(deckId, input) {
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
    },
    listDeckNoteTypes(deckId, input) {
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
    },
    importAnkiDecks(ankiPackage) {
      return sqlite.transaction(() => {
        const importedDecks: Deck[] = [];
        let cardCount = 0;
        let noteCount = 0;
        const insertDeck = sqlite.prepare(
          `insert into decks (id, name, description, created_at, updated_at)
           values (?, ?, ?, ?, ?)`,
        );
        const insertNoteType = sqlite.prepare(
          `insert into note_types (id, deck_id, anki_id, name, field_names, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?)`,
        );
        const insertCardType = sqlite.prepare(
          `insert into card_types
           (id, deck_id, note_type_id, anki_order, name, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?)`,
        );
        const insertNote = sqlite.prepare(
          `insert into notes
           (id, deck_id, note_type_id, anki_id, anki_guid, anki_model_id, anki_modified_at,
            anki_update_sequence_number, anki_tags, anki_fields, anki_field_names,
            anki_sort_field, anki_checksum, anki_flags, anki_data, front, back,
            created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        const insertCard = sqlite.prepare(
          `insert into cards
           (id, deck_id, note_id, card_type_id, anki_id, anki_card_type, anki_note_id, anki_deck_id,
            anki_order, anki_modified_at, anki_update_sequence_number, anki_type, anki_queue,
            anki_due, anki_interval, anki_factor, anki_repetitions, anki_lapses,
            anki_left, anki_original_due, anki_original_deck_id, anki_flags,
            anki_data, due_at, ease_factor, interval_days, repetitions, lapses,
            created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

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

          insertDeck.run(deck.id, deck.name, deck.description, deck.createdAt, deck.updatedAt);
          importedDecks.push(deck);
          const noteTypeIds = new Map<number, string>();
          const cardTypeIds = new Map<string, string>();

          const getNoteTypeId = (note: (typeof importableNotes)[number]["note"]) => {
            const existing = noteTypeIds.get(note.modelId);

            if (existing) {
              return existing;
            }

            const noteTypeId = crypto.randomUUID();
            insertNoteType.run(
              noteTypeId,
              deck.id,
              note.modelId,
              note.modelName ?? `Note type ${note.modelId}`,
              JSON.stringify(note.fieldNames),
              timestamp,
              timestamp,
            );
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
            insertCardType.run(
              cardTypeId,
              deck.id,
              noteTypeId,
              ankiCard.order,
              name,
              timestamp,
              timestamp,
            );
            cardTypeIds.set(key, cardTypeId);

            return cardTypeId;
          };

          for (const { content, note } of importableNotes) {
            if (!content) {
              continue;
            }

            const noteId = crypto.randomUUID();
            const noteTypeId = getNoteTypeId(note);
            insertNote.run(
              noteId,
              deck.id,
              noteTypeId,
              note.id,
              note.guid,
              note.modelId,
              note.modifiedAt,
              note.updateSequenceNumber,
              JSON.stringify(note.tags),
              JSON.stringify(note.fields),
              JSON.stringify(note.fieldNames),
              note.sortField,
              note.checksum,
              note.flags,
              note.data,
              content.front,
              content.back,
              timestamp,
              timestamp,
            );
            noteCount += 1;

            for (const ankiCard of note.cards) {
              const cardTypeId = getCardTypeId(noteTypeId, ankiCard);
              const cardTypeName = ankiCard.cardType ?? `Card ${ankiCard.order + 1}`;
              insertCard.run(
                crypto.randomUUID(),
                deck.id,
                noteId,
                cardTypeId,
                ankiCard.id,
                cardTypeName,
                ankiCard.noteId,
                ankiCard.deckId,
                ankiCard.order,
                ankiCard.modifiedAt,
                ankiCard.updateSequenceNumber,
                ankiCard.type,
                ankiCard.queue,
                ankiCard.due,
                ankiCard.interval,
                ankiCard.factor,
                ankiCard.repetitions,
                ankiCard.lapses,
                ankiCard.left,
                ankiCard.originalDue,
                ankiCard.originalDeckId,
                ankiCard.flags,
                ankiCard.data,
                timestamp,
                ankiCard.factor > 0 ? ankiCard.factor / 1000 : 2.5,
                Math.max(0, ankiCard.interval),
                Math.max(0, ankiCard.repetitions),
                Math.max(0, ankiCard.lapses),
                timestamp,
                timestamp,
              );
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
      })();
    },
    listDecks(input) {
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
    },
    updateDeck(deckId, input) {
      db.update(decks)
        .set({
          ...input,
          updatedAt: nowIso(),
        })
        .where(eq(decks.id, deckId))
        .run();

      return db.select().from(decks).where(eq(decks.id, deckId)).get();
    },
  };

  function getDeckStudyCounts(deckId: string) {
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
