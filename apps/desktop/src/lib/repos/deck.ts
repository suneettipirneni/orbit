import { eq, sql } from "drizzle-orm";
import type { CreateDeckInput, Deck, DeckDetail, DeckSummary, UpdateDeckInput } from "@orbit/api";
import type { RepoContext } from "./context.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { notes } from "../schemas/note.js";
import { nowIso } from "../time.js";

export interface DeckRepo {
  createDeck(input: CreateDeckInput): Deck;
  deleteDeck(deckId: string): void;
  getDeck(deckId: string): DeckDetail | undefined;
  listDecks(): DeckSummary[];
  updateDeck(deckId: string, input: UpdateDeckInput): Deck | undefined;
}

export function createDeckRepo({ handle }: RepoContext): DeckRepo {
  const { db } = handle;

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
      db.delete(decks).where(eq(decks.id, deckId)).run();
    },
    getDeck(deckId) {
      const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();

      if (!deck) {
        return undefined;
      }

      const deckCards = db
        .select({
          back: notes.back,
          dueAt: cards.dueAt,
          front: notes.front,
          id: cards.id,
          intervalDays: cards.intervalDays,
          noteId: cards.noteId,
        })
        .from(cards)
        .innerJoin(notes, eq(cards.noteId, notes.id))
        .where(eq(cards.deckId, deckId))
        .all();

      return { cards: deckCards, deck };
    },
    listDecks() {
      return db
        .select({
          createdAt: decks.createdAt,
          description: decks.description,
          dueCards: sql<number>`count(case when ${cards.dueAt} <= datetime('now') then 1 end)`,
          id: decks.id,
          name: decks.name,
          totalCards: sql<number>`count(${cards.id})`,
          updatedAt: decks.updatedAt,
        })
        .from(decks)
        .leftJoin(cards, eq(decks.id, cards.deckId))
        .groupBy(decks.id)
        .all();
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
}
