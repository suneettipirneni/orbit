import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import type {
  CardWithNote,
  DueCardsInput,
  PaginatedResponse,
  ReviewRating,
  SchedulerStatus,
  TodayStudySummary,
  UpdateCardInput,
} from "@orbit/api";
import type { OrbitDatabase } from "../database.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { notes } from "../schemas/note.js";
import { normalizePagination, paginatedResponse } from "../pagination.js";
import { reviews } from "../schemas/review.js";
import { scheduleReview } from "../scheduler.js";
import { nowIso } from "../time.js";

const defaultLeechThreshold = 8;

export function getCard(db: OrbitDatabase, cardId: string): CardWithNote | undefined {
  return cardWithNoteWhere(db, cardId);
}

export function getSchedulerStatus(): SchedulerStatus {
  return { upgradeRequired: false };
}

export function getTodayStudySummary(db: OrbitDatabase): TodayStudySummary {
  const { endOfDayIso, startOfDayIso } = getTodayBounds();
  const summary = db
    .select({
      firstReviewAt: sql<null | string>`min(${reviews.createdAt})`,
      lastReviewAt: sql<null | string>`max(${reviews.createdAt})`,
      studiedCards: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(and(gte(reviews.createdAt, startOfDayIso), lt(reviews.createdAt, endOfDayIso)))
    .get();

  return {
    elapsedSeconds: getElapsedSeconds(summary?.firstReviewAt, summary?.lastReviewAt),
    studiedCards: summary?.studiedCards ?? 0,
  };
}

export function listDueCards(
  db: OrbitDatabase,
  input: DueCardsInput = {},
): PaginatedResponse<CardWithNote> {
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
}

export function submitReview(
  db: OrbitDatabase,
  cardId: string,
  rating: ReviewRating,
): CardWithNote | undefined {
  const card = db.select().from(cards).where(eq(cards.id, cardId)).get();

  if (!card) {
    return undefined;
  }

  const scheduled = scheduleReview(card, rating.value);
  const timestamp = nowIso();
  const isLeech = rating.value === 1 && scheduled.lapses >= defaultLeechThreshold;

  db.update(cards)
    .set({
      ankiQueue: isLeech ? -1 : card.ankiQueue,
      dueAt: scheduled.dueAt,
      easeFactor: scheduled.easeFactor,
      intervalDays: scheduled.intervalDays,
      lapses: scheduled.lapses,
      repetitions: scheduled.repetitions,
      updatedAt: timestamp,
    })
    .where(eq(cards.id, cardId))
    .run();

  if (isLeech) {
    const note = db.select().from(notes).where(eq(notes.id, card.noteId)).get();

    db.update(notes)
      .set({
        ankiTags: addTag(note?.ankiTags ?? null, "leech"),
        updatedAt: timestamp,
      })
      .where(eq(notes.id, card.noteId))
      .run();
  }

  db.insert(reviews)
    .values({
      cardId,
      createdAt: timestamp,
      elapsedMilliseconds: rating.elapsedMilliseconds ?? null,
      id: crypto.randomUUID(),
      rating: rating.value,
    })
    .run();

  return cardWithNoteWhere(db, cardId);
}

export function updateCard(
  db: OrbitDatabase,
  cardId: string,
  input: UpdateCardInput,
): CardWithNote | undefined {
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
      ankiDue: input.position ?? card.ankiDue,
      ankiFlags:
        input.flag === undefined ? card.ankiFlags : setUserFlag(card.ankiFlags, input.flag),
      ankiOrder: input.position ?? card.ankiOrder,
      ankiQueue: input.forget
        ? 0
        : input.buried
          ? -2
          : input.suspended === undefined
            ? card.ankiQueue
            : input.suspended
              ? -1
              : restoreQueue(card),
      ankiType: input.forget ? 0 : card.ankiType,
      deckId: input.deckId ?? card.deckId,
      dueAt: input.forget ? nowIso() : (input.dueAt ?? card.dueAt),
      intervalDays: input.forget ? 0 : card.intervalDays,
      lapses: input.forget ? 0 : card.lapses,
      repetitions: input.forget ? 0 : card.repetitions,
      updatedAt: nowIso(),
    })
    .where(eq(cards.id, cardId))
    .run();

  return cardWithNoteWhere(db, cardId);
}

function cardWithNoteWhere(db: OrbitDatabase, cardId: string) {
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
    })
    .from(cards)
    .innerJoin(notes, eq(cards.noteId, notes.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(eq(cards.id, cardId))
    .get();
}

function getTodayBounds() {
  const now = new Date(nowIso());
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);

  return {
    endOfDayIso: endOfDay.toISOString(),
    startOfDayIso: startOfDay.toISOString(),
  };
}

function getElapsedSeconds(firstReviewAt?: null | string, lastReviewAt?: null | string) {
  if (!firstReviewAt || !lastReviewAt) {
    return 0;
  }

  return Math.max(0, Math.round((Date.parse(lastReviewAt) - Date.parse(firstReviewAt)) / 1000));
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

function addTag(currentTags: string[] | null, tag: string) {
  const tags = new Set((currentTags ?? []).map((currentTag) => currentTag.trim()).filter(Boolean));
  const normalizedTag = tag.trim();

  if (normalizedTag) {
    tags.add(normalizedTag);
  }

  return Array.from(tags);
}
