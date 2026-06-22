import { and, asc, eq, isNull, sql, type Query } from "drizzle-orm";
import type {
  CardWithNote,
  DueCardsInput,
  PaginatedResponse,
  ReviewRating,
  ReviewResult,
  SchedulerStatus,
  TodayStudySummary,
} from "@orbit/types";
import { db } from "@/lib/powersync";
import { cards, decks, notes, reviews } from "@/lib/powersync-schema";
import { getCard } from "@/lib/repo/card";

const defaultLeechThreshold = 8;

export function dueCardsQuery(input: DueCardsInput = {}) {
  return paginatedRowsQuery(dueCardsRowsQuery(input), input);
}

function dueCardsRowsQuery(input: DueCardsInput = {}) {
  const pagination = normalizePagination(input);

  return db
    .select({
      ...cardWithNoteSelection(),
      totalCount: totalCount(),
    })
    .from(cards)
    .innerJoin(notes, eq(notes.id, cards.noteId))
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(and(input.deckId ? eq(cards.deckId, input.deckId) : undefined, dueCardFilter()))
    .orderBy(asc(cards.dueAt), asc(cards.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

export function todayStudySummaryQuery() {
  return mappedRowsQuery(todayStudySummaryRowsQuery(), (rows) => mapTodayStudySummary(rows[0]));
}

function todayStudySummaryRowsQuery() {
  const [startOfDayIso, endOfDayIso] = todayBoundsParameters();

  return db
    .select({
      firstReviewAt: sql<string | null>`min(${reviews.createdAt})`,
      lastReviewAt: sql<string | null>`max(${reviews.createdAt})`,
      studiedCards: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(
      and(
        sql`${reviews.createdAt} >= ${startOfDayIso}`,
        sql`${reviews.createdAt} < ${endOfDayIso}`,
      ),
    )
    .limit(1);
}

export async function listDueCards(
  input: DueCardsInput = {},
): Promise<PaginatedResponse<CardWithNote>> {
  const [response] = await dueCardsQuery(input).execute();
  return response ?? paginatedResponse([], input, 0);
}

export function getSchedulerStatus(): SchedulerStatus {
  return { upgradeRequired: false };
}

export async function getTodayStudySummary(): Promise<TodayStudySummary> {
  const [summary] = await todayStudySummaryQuery().execute();
  return summary ?? mapTodayStudySummary();
}

export async function submitReview(cardId: string, rating: ReviewRating): Promise<ReviewResult> {
  const card = await getCard(cardId);

  if (!card) {
    throw new Error("Card not found.");
  }

  const scheduled = scheduleReview(card, rating.value);
  const timestamp = nowIso();
  const isLeech = rating.value === 1 && scheduled.lapses >= defaultLeechThreshold;

  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        ankiQueue: isLeech ? -1 : card.ankiQueue,
        dueAt: scheduled.dueAt,
        easeFactor: scheduled.easeFactor,
        intervalDays: scheduled.intervalDays,
        lapses: scheduled.lapses,
        repetitions: scheduled.repetitions,
        updatedAt: timestamp,
      })
      .where(eq(cards.id, cardId));
    await tx.insert(reviews).values({
      cardId,
      createdAt: timestamp,
      deletedAt: null,
      elapsedMilliseconds: rating.elapsedMilliseconds ?? null,
      id: crypto.randomUUID(),
      rating: rating.value,
    });

    if (isLeech) {
      await tx
        .update(notes)
        .set({ ankiTags: addTag(card.ankiTags, "leech"), updatedAt: timestamp })
        .where(eq(notes.id, card.noteId));
    }
  });

  const updated = await getCard(cardId);

  if (!updated) {
    throw new Error("Card not found after review.");
  }

  return { card: updated, nextDueAt: scheduled.nextDueAt };
}

function scheduleReview(
  state: {
    dueAt: string;
    easeFactor: number;
    intervalDays: number;
    lapses: number;
    repetitions: number;
  },
  rating: 1 | 2 | 3 | 4 | 5,
  now = new Date(),
) {
  if (rating < 3) {
    const lapses = state.lapses + 1;
    const nextDueAt = addDays(now, 1).toISOString();

    return {
      dueAt: nextDueAt,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 1,
      lapses,
      nextDueAt,
      repetitions: 0,
    };
  }

  const easeFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
  );
  const repetitions = state.repetitions + 1;
  const intervalDays =
    repetitions === 1
      ? 1
      : repetitions === 2
        ? 6
        : Math.max(1, Math.round(state.intervalDays * easeFactor));
  const nextDueAt = addDays(now, intervalDays).toISOString();

  return {
    dueAt: nextDueAt,
    easeFactor,
    intervalDays,
    lapses: state.lapses,
    nextDueAt,
    repetitions,
  };
}

function addTag(currentTags: string[] | null, tag: string) {
  const tags = new Set((currentTags ?? []).map((currentTag) => currentTag.trim()).filter(Boolean));
  const normalizedTag = tag.trim();

  if (normalizedTag) {
    tags.add(normalizedTag);
  }

  return Array.from(tags);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

interface ExecutableRowsQuery<TRow> {
  execute(): Promise<TRow[]>;
  toSQL(): Query;
}

function mappedRowsQuery<TRow, TData>(
  query: ExecutableRowsQuery<TRow>,
  mapRows: (rows: TRow[]) => TData | undefined,
) {
  return {
    execute: async () => {
      const data = mapRows(await query.execute());
      return data === undefined ? [] : [data];
    },
    toSQL: () => query.toSQL(),
  };
}

function paginatedRowsQuery<TRow extends { totalCount: number }>(
  query: ExecutableRowsQuery<TRow>,
  input: DueCardsInput,
) {
  return mappedRowsQuery(query, (rows) =>
    paginatedResponse(rows.map(stripTotalCount), input, rows[0]?.totalCount ?? rows.length),
  );
}

function stripTotalCount<TRow extends { totalCount: number }>(row: TRow) {
  const { totalCount, ...data } = row;
  void totalCount;
  return data;
}

function mapTodayStudySummary(row?: {
  firstReviewAt: string | null;
  lastReviewAt: string | null;
  studiedCards: number;
}): TodayStudySummary {
  return {
    elapsedSeconds: getElapsedSeconds(row?.firstReviewAt, row?.lastReviewAt),
    studiedCards: row?.studiedCards ?? 0,
  };
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

function dueCardFilter() {
  return and(
    activeCardFilter(),
    sql`${cards.dueAt} <= ${currentTimestampSql()}`,
    sql`coalesce(${cards.ankiQueue}, 0) not in (-1, -2, -3)`,
  );
}

function totalCount() {
  return sql<number>`count(*) over ()`;
}

function normalizePagination(input: DueCardsInput = {}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, input.pageSize ?? 50));

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
    pageSize,
  };
}

function paginatedResponse<TData>(
  data: TData[],
  input: DueCardsInput,
  total: number,
): PaginatedResponse<TData> {
  const pagination = normalizePagination(input);

  return {
    data,
    pagination: {
      page: pagination.page,
      pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
      pageSize: pagination.pageSize,
      total,
    },
  };
}

function nowIso() {
  return new Date().toISOString();
}

function currentTimestampSql() {
  return sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;
}

function todayBoundsParameters() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);

  return [startOfDay.toISOString(), endOfDay.toISOString()] as const;
}

function getElapsedSeconds(firstReviewAt?: null | string, lastReviewAt?: null | string) {
  if (!firstReviewAt || !lastReviewAt) {
    return 0;
  }

  return Math.max(0, Math.round((Date.parse(lastReviewAt) - Date.parse(firstReviewAt)) / 1000));
}
