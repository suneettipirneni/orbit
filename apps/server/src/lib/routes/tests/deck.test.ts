import type {
  CardPreview,
  Deck,
  DeckDetail,
  DeckSummary,
  ImportAnkiDecksResult,
  PaginatedResponse,
} from "@orbit/api";
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
