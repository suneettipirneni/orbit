import { and, eq, lte, sql } from "drizzle-orm";
import type { CardWithNote, DueCardsInput, PaginatedResponse } from "@orbit/api";
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
}

export function createCardRepo({ handle }: RepoContext): CardRepo {
  const { db } = handle;

  function cardWithNoteWhere(cardId: string) {
    return db
      .select({
        back: notes.back,
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
      const dueFilter = lte(cards.dueAt, nowIso());
      const filter = input.deckId ? and(dueFilter, eq(cards.deckId, input.deckId)) : dueFilter;
      const total =
        db
          .select({ count: sql<number>`count(*)` })
          .from(cards)
          .where(filter)
          .get()?.count ?? 0;

      const data = db
        .select({
          back: notes.back,
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
  };
}
