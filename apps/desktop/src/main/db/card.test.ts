import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import * as cardRepo from "@orbit/db/card";
import * as deckRepo from "@orbit/db/deck";
import * as noteRepo from "@orbit/db/note";
import { schema } from "@orbit/db";
import { createDesktopDatabase, type DesktopDatabase } from "./database.js";

const require = createRequire(import.meta.url);
const betterSqliteRoot = dirname(require.resolve("better-sqlite3/package.json"));
const nativeBinding = join(betterSqliteRoot, "build/Release/better_sqlite3.node");
const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

describe("card repository", () => {
  let currentFixture: RepositoryFixture | undefined;

  afterEach(() => {
    currentFixture?.cleanup();
    currentFixture = undefined;
  });

  it("ANKI-REVIEW-017: persists capped elapsed answer time with the review record", () => {
    currentFixture = createRepositoryFixture();
    const { database } = currentFixture;
    const deck = deckRepo.createDeck(database.db, { name: "Default" });
    const note = noteRepo.createNote(database.db, {
      back: "Paris",
      deckId: deck.id,
      front: "Capital of France",
    });
    const card = cardRepo
      .listDueCards(database.db, { deckId: deck.id })
      .data.find((dueCard) => dueCard.noteId === note.id);

    expect(card).toBeDefined();

    cardRepo.submitReview(database.db, card!.id, { elapsedMilliseconds: 30_000, value: 4 });

    const review = database.db
      .select({
        elapsedMilliseconds: schema.reviews.elapsedMilliseconds,
        rating: schema.reviews.rating,
      })
      .from(schema.reviews)
      .where(eq(schema.reviews.cardId, card!.id))
      .get();

    expect(review).toEqual({
      elapsedMilliseconds: 30_000,
      rating: 4,
    });
  });

  it("ANKI-REVIEW-018: suspends and tags a card that reaches the leech lapse threshold", () => {
    currentFixture = createRepositoryFixture();
    const { database } = currentFixture;
    const deck = deckRepo.createDeck(database.db, { name: "Default" });
    const note = noteRepo.createNote(database.db, {
      back: "Paris",
      deckId: deck.id,
      front: "Capital of France",
    });
    const card = cardRepo
      .listDueCards(database.db, { deckId: deck.id })
      .data.find((dueCard) => dueCard.noteId === note.id);

    expect(card).toBeDefined();

    database.db
      .update(schema.cards)
      .set({ lapses: 7, repetitions: 7 })
      .where(eq(schema.cards.id, card!.id))
      .run();

    cardRepo.submitReview(database.db, card!.id, { value: 1 });

    const updatedCard = database.db
      .select({ ankiQueue: schema.cards.ankiQueue, lapses: schema.cards.lapses })
      .from(schema.cards)
      .where(eq(schema.cards.id, card!.id))
      .get();
    const updatedNote = database.db
      .select({ ankiTags: schema.notes.ankiTags })
      .from(schema.notes)
      .where(eq(schema.notes.id, note.id))
      .get();

    expect(updatedCard).toEqual({ ankiQueue: -1, lapses: 8 });
    expect(updatedNote?.ankiTags).toContain("leech");
    expect(cardRepo.listDueCards(database.db, { deckId: deck.id }).data).toEqual([]);
  });
});

interface RepositoryFixture {
  cleanup: () => void;
  database: DesktopDatabase;
}

function createRepositoryFixture(): RepositoryFixture {
  const directory = mkdtempSync(join(tmpdir(), "orbit-db-test-"));
  const database = createDesktopDatabase({
    databasePath: join(directory, "orbit.sqlite"),
    migrationsFolder,
    nativeBinding,
  });

  return {
    cleanup() {
      database.close();
      rmSync(directory, { force: true, recursive: true });
    },
    database,
  };
}
