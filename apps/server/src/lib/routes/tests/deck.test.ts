import type {
  CardPreview,
  CardWithNote,
  Deck,
  DeckDetail,
  DeckSummary,
  ImportAnkiDecksResult,
  Note,
  PaginatedResponse,
} from "@orbit/api";
import type { AnkiPackage } from "@orbit/anki";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createTestContext, requestJson } from "./helpers.js";

describe("deck routes", () => {
  it("creates, lists, reads, updates, and deletes decks", async () => {
    const context = createTestContext();

    try {
      const createResponse = await requestJson(context, "/decks", "POST", {
        description: "Cell biology",
        name: "Biology",
      });
      const created = (await createResponse.json()) as Deck;

      expect(createResponse.status).toBe(201);
      expect(created).toMatchObject({
        description: "Cell biology",
        name: "Biology",
      });

      const listResponse = await context.app.request("/decks");
      const listBody = (await listResponse.json()) as PaginatedResponse<DeckSummary>;

      expect(listResponse.status).toBe(200);
      expect(listBody.data).toHaveLength(1);
      expect(listBody.data[0]).toMatchObject({
        description: "Cell biology",
        id: created.id,
        name: "Biology",
        totalCards: 0,
      });

      const getResponse = await context.app.request(`/decks/${created.id}`);
      const getBody = (await getResponse.json()) as DeckDetail;

      expect(getResponse.status).toBe(200);
      expect(getBody).toEqual({ deck: created });

      const updateResponse = await requestJson(context, `/decks/${created.id}`, "PATCH", {
        description: null,
        name: "Advanced Biology",
      });
      const updated = (await updateResponse.json()) as Deck;

      expect(updateResponse.status).toBe(200);
      expect(updated).toMatchObject({
        description: null,
        id: created.id,
        name: "Advanced Biology",
      });

      const missingUpdateResponse = await requestJson(context, "/decks/missing", "PATCH", {
        name: "Missing",
      });
      expect(missingUpdateResponse.status).toBe(404);

      const deleteResponse = await context.app.request(`/decks/${created.id}`, {
        method: "DELETE",
      });
      expect(deleteResponse.status).toBe(204);

      const deletedResponse = await context.app.request(`/decks/${created.id}`);
      expect(deletedResponse.status).toBe(404);
    } finally {
      context.cleanup();
    }
  });

  it("paginates deck listings", async () => {
    const context = createTestContext();

    try {
      context.repositories.createDeck({ name: "Deck 1" });
      context.repositories.createDeck({ name: "Deck 2" });
      context.repositories.createDeck({ name: "Deck 3" });

      const response = await context.app.request("/decks?page=2&pageSize=2");
      const body = (await response.json()) as PaginatedResponse<DeckSummary>;

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.pagination).toEqual({
        page: 2,
        pageCount: 2,
        pageSize: 2,
        total: 3,
      });
    } finally {
      context.cleanup();
    }
  });

  it("filters deck cards with Anki-style query text", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Spanish" });
      context.repositories.createNote({
        back: "hola",
        deckId: deck.id,
        front: "hello",
      });
      context.repositories.createNote({
        back: "adios",
        deckId: deck.id,
        front: "goodbye",
      });

      const response = await context.app.request(
        `/decks/${deck.id}/cards?query=${encodeURIComponent('front:hello deck:"Spanish"')}`,
      );
      const body = (await response.json()) as PaginatedResponse<CardPreview>;

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        back: "hola",
        front: "hello",
      });
      expect(body.pagination.total).toBe(1);
    } finally {
      context.cleanup();
    }
  });

  it("imports Anki package uploads into decks, notes, and cards", async () => {
    const context = createTestContext();

    try {
      const formData = new FormData();
      formData.append(
        "file",
        new File(
          [readFileSync(new URL("./fixtures/dummy-deck-2109889812.apkg", import.meta.url))],
          "dummy-deck-2109889812.apkg",
        ),
      );

      const response = await context.app.request("/decks/import/anki", {
        body: formData,
        method: "POST",
      });
      const body = (await response.json()) as ImportAnkiDecksResult;

      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        cardCount: 3,
        deckCount: 1,
        noteCount: 3,
      });
      expect(body.decks[0]).toMatchObject({
        description: "Imported from Anki.",
        name: "Ultimate Geography v5.32/ geography world countries capitals flags maps",
      });

      const importedDeck = body.decks[0];
      if (!importedDeck) {
        throw new Error("Expected import to create a deck.");
      }

      const cardsResponse = await context.app.request(`/decks/${importedDeck.id}/cards`);
      const cardsBody = (await cardsResponse.json()) as PaginatedResponse<CardPreview>;

      expect(cardsResponse.status).toBe(200);
      expect(cardsBody.data).toHaveLength(3);
      expect(cardsBody.data.map((card) => card.front)).toEqual(
        expect.arrayContaining(["Bangladesh", "Guadeloupe", "Scandinavia"]),
      );
      expect(cardsBody.data.every((card) => card.intervalDays === 0)).toBe(true);

      const importedCard = cardsBody.data.find((card) => card.front === "Bangladesh");
      if (!importedCard) {
        throw new Error("Expected Bangladesh card to be imported.");
      }
      expect(typeof importedCard.ankiSortField).toBe("string");
      expect(typeof importedCard.ankiType).toBe("number");

      const cardResponse = await context.app.request(`/cards/${importedCard.id}`);
      const cardBody = (await cardResponse.json()) as CardWithNote;
      const noteResponse = await context.app.request(`/notes/${importedCard.noteId}`);
      const noteBody = (await noteResponse.json()) as Note;

      expect(typeof cardBody.ankiDeckId).toBe("number");
      expect(typeof cardBody.ankiDue).toBe("number");
      expect(typeof cardBody.ankiFactor).toBe("number");
      expect(typeof cardBody.ankiId).toBe("number");
      expect(typeof cardBody.ankiInterval).toBe("number");
      expect(typeof cardBody.ankiLapses).toBe("number");
      expect(typeof cardBody.ankiNoteId).toBe("number");
      expect(typeof cardBody.ankiOrder).toBe("number");
      expect(typeof cardBody.ankiQueue).toBe("number");
      expect(typeof cardBody.ankiRepetitions).toBe("number");
      expect(typeof cardBody.ankiType).toBe("number");
      expect(typeof noteBody.ankiChecksum).toBe("number");
      expect(Array.isArray(noteBody.ankiFieldNames)).toBe(true);
      expect(noteBody.ankiFields).toContain("Bangladesh");
      expect(typeof noteBody.ankiGuid).toBe("string");
      expect(typeof noteBody.ankiId).toBe("number");
      expect(typeof noteBody.ankiModelId).toBe("number");
      expect(Array.isArray(noteBody.ankiTags)).toBe(true);
    } finally {
      context.cleanup();
    }
  });

  it("stores Anki card template names as card types", () => {
    const context = createTestContext();

    try {
      const ankiPackage: AnkiPackage = {
        decks: [
          {
            id: 10,
            name: "Typed cards",
            notes: [
              {
                cards: [
                  {
                    cardType: "Forward",
                    data: "",
                    deckId: 10,
                    due: 0,
                    factor: 2500,
                    flags: 0,
                    id: 20,
                    interval: 0,
                    lapses: 0,
                    left: 0,
                    modifiedAt: 1,
                    noteId: 30,
                    order: 0,
                    originalDeckId: 0,
                    originalDue: 0,
                    queue: 0,
                    repetitions: 0,
                    type: 0,
                    updateSequenceNumber: 0,
                  },
                ],
                checksum: 0,
                data: "",
                fieldNames: ["Front", "Back"],
                fields: ["Front text", "Back text"],
                flags: 0,
                guid: "typed-note",
                id: 30,
                modelId: 40,
                modelName: "Basic",
                modifiedAt: 1,
                sortField: "Front text",
                tags: [],
                updateSequenceNumber: 0,
              },
            ],
          },
        ],
        media: {},
      };

      const result = context.repositories.importAnkiDecks(ankiPackage);
      const importedDeck = result.decks[0];

      if (!importedDeck) {
        throw new Error("Expected import to create a deck.");
      }

      const cards = context.repositories.listDeckCards(importedDeck.id)?.data;
      const noteTypes = context.repositories.listDeckNoteTypes(importedDeck.id)?.data;
      const cardTypes = context.repositories.listDeckCardTypes(importedDeck.id)?.data;

      expect(cards).toEqual([
        expect.objectContaining({
          ankiCardType: "Forward",
          ankiSortField: "Front text",
          ankiType: 0,
          front: "Front text",
        }),
      ]);
      expect(noteTypes).toEqual([
        expect.objectContaining({
          ankiId: 40,
          fieldNames: ["Front", "Back"],
          name: "Basic",
        }),
      ]);
      expect(cardTypes).toEqual([
        expect.objectContaining({
          ankiOrder: 0,
          name: "Forward",
          noteTypeName: "Basic",
        }),
      ]);
    } finally {
      context.cleanup();
    }
  });

  it("rejects missing and unsupported Anki uploads", async () => {
    const context = createTestContext();

    try {
      const missingFileResponse = await context.app.request("/decks/import/anki", {
        body: new FormData(),
        method: "POST",
      });

      const formData = new FormData();
      formData.append("file", new File(["not an anki package"], "notes.txt"));
      const unsupportedFileResponse = await context.app.request("/decks/import/anki", {
        body: formData,
        method: "POST",
      });

      expect(missingFileResponse.status).toBe(400);
      expect(await missingFileResponse.text()).toBe(
        "Upload an Anki deck file in the 'file' form field.",
      );
      expect(unsupportedFileResponse.status).toBe(400);
      expect(await unsupportedFileResponse.text()).toBe(
        "Unsupported Anki file format. Use .apkg, .colpkg, .anki2, or .anki21.",
      );
    } finally {
      context.cleanup();
    }
  });

  it("paginates deck card listings", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Card deck" });
      context.repositories.createNote({ back: "Back 1", deckId: deck.id, front: "Front 1" });
      context.repositories.createNote({ back: "Back 2", deckId: deck.id, front: "Front 2" });
      context.repositories.createNote({ back: "Back 3", deckId: deck.id, front: "Front 3" });

      const response = await context.app.request(`/decks/${deck.id}/cards?page=2&pageSize=2`);
      const body = (await response.json()) as PaginatedResponse<CardPreview>;

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.pagination).toEqual({
        page: 2,
        pageCount: 2,
        pageSize: 2,
        total: 3,
      });
    } finally {
      context.cleanup();
    }
  });

  it("returns 404 when listing cards for a missing deck", async () => {
    const context = createTestContext();

    try {
      const response = await context.app.request("/decks/missing/cards");
      expect(response.status).toBe(404);
    } finally {
      context.cleanup();
    }
  });

  it("rejects invalid request bodies", async () => {
    const context = createTestContext();

    try {
      const response = await context.app.request("/decks", {
        body: JSON.stringify({ description: 42, name: "Invalid deck" }),
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
      });

      expect(response.status).toBe(400);
    } finally {
      context.cleanup();
    }
  });
});
