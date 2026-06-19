import { and, eq, lte, sql } from "drizzle-orm";
import type { CardWithNote, DueCardsInput, PaginatedResponse, UpdateCardInput } from "@orbit/api";
import type { RepoContext } from "./context.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { notes } from "../schemas/note.js";
import { normalizePagination, paginatedResponse } from "../pagination.js";
import { reviews } from "../schemas/review.js";
import { scheduleReview } from "../scheduler.js";
import { nowIso } from "../time.js";

export interface CardRepo {
  getCard(cardId: string): CardWithNote | undefined;
  listDueCards(input?: DueCardsInput): PaginatedResponse<CardWithNote>;
  submitReview(cardId: string, rating: 1 | 2 | 3 | 4 | 5): CardWithNote | undefined;
  updateCard(cardId: string, input: UpdateCardInput): CardWithNote | undefined;
}

export function createCardRepo({ handle }: RepoContext): CardRepo {
  const { db } = handle;

  function cardWithNoteWhere(cardId: string) {
    return db
      .select({
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
      })
      .from(cards)
      .innerJoin(notes, eq(cards.noteId, notes.id))
      .innerJoin(decks, eq(cards.deckId, decks.id))
      .where(eq(cards.id, cardId))
      .get();
  }

  return {
    getCard(cardId) {
      return cardWithNoteWhere(cardId);
    },
    listDueCards(input = {}) {
      const pagination = normalizePagination(input);
      const dueFilter = and(lte(cards.dueAt, nowIso()), normalQueueFilter());
      const filter = input.deckId ? and(dueFilter, eq(cards.deckId, input.deckId)) : dueFilter;
      const total =
        db
          .select({ count: sql<number>`count(*)` })
          .from(cards)
          .where(filter)
          .get()?.count ?? 0;

      const data = db
        .select({
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
        })
        .from(cards)
        .innerJoin(notes, eq(cards.noteId, notes.id))
        .innerJoin(decks, eq(cards.deckId, decks.id))
        .where(filter)
        .orderBy(cards.dueAt)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .all();

      return paginatedResponse(data, pagination, total);
    },
    submitReview(cardId, rating) {
      const card = db.select().from(cards).where(eq(cards.id, cardId)).get();

      if (!card) {
        return undefined;
      }

      const scheduled = scheduleReview(card, rating);
      const timestamp = nowIso();

      db.update(cards)
        .set({
          dueAt: scheduled.dueAt,
          easeFactor: scheduled.easeFactor,
          intervalDays: scheduled.intervalDays,
          lapses: scheduled.lapses,
          repetitions: scheduled.repetitions,
          updatedAt: timestamp,
        })
        .where(eq(cards.id, cardId))
        .run();

      db.insert(reviews)
        .values({
          cardId,
          createdAt: timestamp,
          id: crypto.randomUUID(),
          rating,
        })
        .run();

      return cardWithNoteWhere(cardId);
    },
    updateCard(cardId, input) {
      const card = db.select().from(cards).where(eq(cards.id, cardId)).get();

      if (!card) {
        return undefined;
      }

      if (input.deckId) {
        const targetDeck = db
          .select({ id: decks.id })
          .from(decks)
          .where(eq(decks.id, input.deckId))
          .get();

        if (!targetDeck) {
          return undefined;
        }
      }

      db.update(cards)
        .set({
          ankiFlags:
            input.flag === undefined ? card.ankiFlags : setUserFlag(card.ankiFlags, input.flag),
          ankiDue: input.position ?? card.ankiDue,
          ankiOrder: input.position ?? card.ankiOrder,
          deckId: input.deckId ?? card.deckId,
          ankiType: input.forget ? 0 : card.ankiType,
          ankiQueue: input.forget
            ? 0
            : input.buried
              ? -2
              : input.suspended === undefined
                ? card.ankiQueue
                : input.suspended
                  ? -1
                  : restoreQueue(card),
          dueAt: input.forget ? nowIso() : (input.dueAt ?? card.dueAt),
          intervalDays: input.forget ? 0 : card.intervalDays,
          lapses: input.forget ? 0 : card.lapses,
          repetitions: input.forget ? 0 : card.repetitions,
          updatedAt: nowIso(),
        })
        .where(eq(cards.id, cardId))
        .run();

      return cardWithNoteWhere(cardId);
    },
  };
}

function normalQueueFilter() {
  return sql`coalesce(${cards.ankiQueue}, 0) not in (-1, -2, -3)`;
}

function restoreQueue(card: typeof cards.$inferSelect) {
  if (card.ankiType === 0 || card.ankiType === 1 || card.ankiType === 2) {
    return card.ankiType;
  }

  return card.repetitions === 0 ? 0 : 2;
}

function setUserFlag(flags: number | null, flag: number) {
  return ((flags ?? 0) & ~7) | flag;
}
