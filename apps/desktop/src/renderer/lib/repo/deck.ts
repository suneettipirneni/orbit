import { and, asc, eq, isNull, like, sql, type Query } from "drizzle-orm";
import type { AnkiPackage } from "@orbit/anki";
import type {
  CardPreview,
  CreateDeckInput,
  Deck,
  DeckDetail,
  DeckSummary,
  DeleteDeckResult,
  ImportAnkiDecksInput,
  ImportAnkiDecksResult,
  ListDeckCardsInput,
  PaginatedResponse,
  PaginationInput,
  UpdateDeckInput,
} from "@orbit/types";
import { db } from "@/lib/powersync";
import { cards, cardTypes, decks, noteTypes, notes } from "@/lib/powersync-schema";

export const allDecksCardScope = "__all__";

type DeckSummaryRow = Deck & {
  dueCards: number;
  learningCards: number;
  newCards: number;
  reviewCards: number;
  totalCards: number;
  totalCount: number;
};

type DeckDetailRow = DeckSummaryRow;

export function decksListQuery(input: PaginationInput = {}) {
  return paginatedRowsQuery(decksListRowsQuery(input), input);
}

function decksListRowsQuery(input: PaginationInput = {}) {
  const pagination = normalizePagination(input);

  return db
    .select({
      createdAt: decks.createdAt,
      description: decks.description,
      dueCards: dueCount(),
      id: decks.id,
      learningCards: learningCount(),
      name: decks.name,
      newCards: newCount(),
      reviewCards: reviewCount(),
      totalCards: sql<number>`count(${cards.id})`,
      totalCount: totalCount(),
      updatedAt: decks.updatedAt,
    })
    .from(decks)
    .leftJoin(cards, and(eq(cards.deckId, decks.id), isNull(cards.deletedAt)))
    .where(isNull(decks.deletedAt))
    .groupBy(decks.id)
    .orderBy(asc(decks.name), asc(decks.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

export function deckDetailQuery(deckId: string) {
  return mappedRowsQuery(deckDetailRowsQuery(deckId), (rows) =>
    rows[0] ? mapDeckDetail(rows[0]) : undefined,
  );
}

function deckDetailRowsQuery(deckId: string) {
  return db
    .select({
      createdAt: decks.createdAt,
      description: decks.description,
      dueCards: dueCount(),
      id: decks.id,
      learningCards: learningCount(),
      name: decks.name,
      newCards: newCount(),
      reviewCards: reviewCount(),
      totalCards: sql<number>`count(${cards.id})`,
      totalCount: totalCount(),
      updatedAt: decks.updatedAt,
    })
    .from(decks)
    .leftJoin(cards, and(eq(cards.deckId, decks.id), isNull(cards.deletedAt)))
    .where(and(eq(decks.id, deckId), isNull(decks.deletedAt)))
    .groupBy(decks.id)
    .limit(1);
}

export function deckCardsQuery(deckId: string, input: ListDeckCardsInput = {}) {
  return paginatedRowsQuery(deckCardsRowsQuery(deckId, input), input);
}

function deckCardsRowsQuery(deckId: string, input: ListDeckCardsInput = {}) {
  const pagination = normalizePagination(input);
  const queryText = input.query?.trim();
  const textFilter = queryText
    ? like(sql<string>`${notes.front} || ' ' || ${notes.back}`, `%${queryText}%`)
    : undefined;

  return db
    .select({
      ...cardPreviewSelection(),
      totalCount: totalCount(),
    })
    .from(cards)
    .innerJoin(notes, eq(notes.id, cards.noteId))
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(
      and(
        deckId === allDecksCardScope ? undefined : eq(cards.deckId, deckId),
        textFilter,
        activeCardFilter(),
      ),
    )
    .orderBy(asc(cards.createdAt), asc(cards.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

export async function listDecks(
  input: PaginationInput = {},
): Promise<PaginatedResponse<DeckSummary>> {
  const [response] = await decksListQuery(input).execute();
  return response ?? paginatedResponse([], input, 0);
}

export async function getDeck(deckId: string): Promise<DeckDetail | undefined> {
  const [deck] = await deckDetailQuery(deckId).execute();
  return deck;
}

export async function listDeckCards(
  deckId: string,
  input: ListDeckCardsInput = {},
): Promise<PaginatedResponse<CardPreview>> {
  const [response] = await deckCardsQuery(deckId, input).execute();
  return response ?? paginatedResponse([], input, 0);
}

export async function createDeck(input: CreateDeckInput): Promise<Deck> {
  const timestamp = nowIso();
  const deck: Deck = {
    createdAt: timestamp,
    description: input.description ?? null,
    id: crypto.randomUUID(),
    name: input.name,
    updatedAt: timestamp,
  };

  await db.insert(decks).values({
    createdAt: deck.createdAt,
    deletedAt: null,
    description: deck.description,
    id: deck.id,
    name: deck.name,
    updatedAt: deck.updatedAt,
  });

  return deck;
}

export async function updateDeck(deckId: string, input: UpdateDeckInput): Promise<Deck> {
  const existing = await getDeck(deckId);

  if (!existing) {
    throw new Error("Deck not found.");
  }

  const timestamp = nowIso();
  const deck: Deck = {
    ...existing.deck,
    description: input.description === undefined ? existing.deck.description : input.description,
    name: input.name ?? existing.deck.name,
    updatedAt: timestamp,
  };

  await db
    .update(decks)
    .set({
      description: deck.description,
      name: deck.name,
      updatedAt: deck.updatedAt,
    })
    .where(and(eq(decks.id, deckId), isNull(decks.deletedAt)));

  return deck;
}

export async function deleteDeck(deckId: string): Promise<DeleteDeckResult> {
  const timestamp = nowIso();
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNull(cards.deletedAt)))
    .get();

  await db
    .update(decks)
    .set({ deletedAt: timestamp, updatedAt: timestamp })
    .where(eq(decks.id, deckId));

  return { deletedCards: row?.count ?? 0 };
}

export async function importAnkiDecks(input: ImportAnkiDecksInput): Promise<ImportAnkiDecksResult> {
  const ankiPackage = await window.api.decks.loadAnkiPackage({
    data: await input.file.arrayBuffer(),
    fileName: input.file.name,
  });

  return importAnkiPackage(ankiPackage);
}

async function importAnkiPackage(ankiPackage: AnkiPackage): Promise<ImportAnkiDecksResult> {
  const importedDecks: Deck[] = [];
  let cardCount = 0;
  let noteCount = 0;

  await db.transaction(async (tx) => {
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

      await tx.insert(decks).values({
        ...deck,
        deletedAt: null,
      });
      importedDecks.push(deck);

      const noteTypeIds = new Map<number, string>();
      const cardTypeIds = new Map<string, string>();

      const getNoteTypeId = async (note: (typeof importableNotes)[number]["note"]) => {
        const existing = noteTypeIds.get(note.modelId);

        if (existing) {
          return existing;
        }

        const noteTypeId = crypto.randomUUID();
        await tx.insert(noteTypes).values({
          ankiId: note.modelId,
          createdAt: timestamp,
          deckId: deck.id,
          fieldNames: note.fieldNames,
          id: noteTypeId,
          name: note.modelName ?? `Note type ${note.modelId}`,
          updatedAt: timestamp,
        });
        noteTypeIds.set(note.modelId, noteTypeId);

        return noteTypeId;
      };

      const getCardTypeId = async (
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
        await tx.insert(cardTypes).values({
          ankiOrder: ankiCard.order,
          createdAt: timestamp,
          deckId: deck.id,
          id: cardTypeId,
          name,
          noteTypeId,
          updatedAt: timestamp,
        });
        cardTypeIds.set(key, cardTypeId);

        return cardTypeId;
      };

      for (const { content, note } of importableNotes) {
        if (!content) {
          continue;
        }

        const noteId = crypto.randomUUID();
        const noteTypeId = await getNoteTypeId(note);
        await tx.insert(notes).values({
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
          deletedAt: null,
          front: content.front,
          id: noteId,
          noteTypeId,
          updatedAt: timestamp,
        });
        noteCount += 1;

        for (const ankiCard of note.cards) {
          const cardTypeId = await getCardTypeId(noteTypeId, ankiCard);
          const cardTypeName = ankiCard.cardType ?? `Card ${ankiCard.order + 1}`;
          const cardId = crypto.randomUUID();

          await tx.insert(cards).values({
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
            deletedAt: null,
            dueAt: timestamp,
            easeFactor: ankiCard.factor > 0 ? ankiCard.factor / 1000 : 2.5,
            id: cardId,
            intervalDays: Math.max(0, ankiCard.interval),
            lapses: Math.max(0, ankiCard.lapses),
            noteId,
            repetitions: Math.max(0, ankiCard.repetitions),
            updatedAt: timestamp,
          });
          cardCount += 1;
        }
      }
    }
  });

  if (importedDecks.length === 0) {
    throw new Error("No importable Anki cards were found in this file.");
  }

  return {
    cardCount,
    deckCount: importedDecks.length,
    decks: importedDecks,
    noteCount,
  };
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
  input: PaginationInput,
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

function mapDeckDetail(row: DeckDetailRow): DeckDetail {
  return {
    counts: {
      due: row.dueCards,
      learning: row.learningCards,
      new: row.newCards,
      review: row.reviewCards,
      total: row.totalCards,
    },
    deck: stripTotalCount(row),
  };
}

function cardPreviewSelection() {
  return {
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
  };
}

function activeCardFilter() {
  return and(isNull(cards.deletedAt), isNull(notes.deletedAt), isNull(decks.deletedAt));
}

function dueCount() {
  return sql<number>`count(case when ${cards.dueAt} <= ${currentTimestampSql()} then 1 end)`;
}

function newCount() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, case when ${cards.repetitions} = 0 then 0 else 2 end) = 0 then 1 end)`;
}

function learningCount() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, 2) = 1 then 1 end)`;
}

function reviewCount() {
  return sql<number>`count(case when coalesce(${cards.ankiType}, case when ${cards.repetitions} = 0 then 0 else 2 end) = 2 then 1 end)`;
}

function totalCount() {
  return sql<number>`count(*) over ()`;
}

function currentTimestampSql() {
  return sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;
}

function normalizePagination(input: PaginationInput = {}) {
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
  input: PaginationInput,
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

function nowIso() {
  return new Date().toISOString();
}
