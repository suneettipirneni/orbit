import { eq, sql } from "drizzle-orm";
import type { AnkiPackage } from "@orbit/anki";
import type {
  CreateDeckInput,
  Deck,
  DeckDetail,
  DeckSummary,
  ImportAnkiDecksResult,
  UpdateDeckInput,
} from "@orbit/api";
import type { RepoContext } from "./context.js";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { notes } from "../schemas/note.js";
import { nowIso } from "../time.js";

export interface DeckRepo {
  createDeck(input: CreateDeckInput): Deck;
  deleteDeck(deckId: string): void;
  getDeck(deckId: string): DeckDetail | undefined;
  importAnkiDecks(ankiPackage: AnkiPackage): ImportAnkiDecksResult;
  listDecks(): DeckSummary[];
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
    importAnkiDecks(ankiPackage) {
      return sqlite.transaction(() => {
        const importedDecks: Deck[] = [];
        let cardCount = 0;
        let noteCount = 0;
        const insertDeck = sqlite.prepare(
          `insert into decks (id, name, description, created_at, updated_at)
           values (?, ?, ?, ?, ?)`,
        );
        const insertNote = sqlite.prepare(
          `insert into notes (id, deck_id, front, back, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?)`,
        );
        const insertCard = sqlite.prepare(
          `insert into cards
           (id, deck_id, note_id, due_at, ease_factor, interval_days, repetitions, lapses, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

          for (const { content, note } of importableNotes) {
            if (!content) {
              continue;
            }

            const noteId = crypto.randomUUID();
            insertNote.run(noteId, deck.id, content.front, content.back, timestamp, timestamp);
            noteCount += 1;

            for (const ankiCard of note.cards) {
              insertCard.run(
                crypto.randomUUID(),
                deck.id,
                noteId,
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
