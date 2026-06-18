import type { CardWithNote, PaginatedResponse, ReviewResult } from "@orbit/api";
import { describe, expect, it } from "vitest";
import { createTestContext, getOnlyDeckCard, requestJson } from "./helpers.js";

describe("review routes", () => {
  it("paginates due-card listings", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Due deck" });
      context.repositories.createNote({ back: "Back 1", deckId: deck.id, front: "Front 1" });
      context.repositories.createNote({ back: "Back 2", deckId: deck.id, front: "Front 2" });
      context.repositories.createNote({ back: "Back 3", deckId: deck.id, front: "Front 3" });

      const response = await context.app.request(
        `/reviews/due?deckId=${deck.id}&page=2&pageSize=2`,
      );
      const body = (await response.json()) as PaginatedResponse<CardWithNote>;

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

  it("lists due cards and submits reviews", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Review deck" });
      const note = context.repositories.createNote({
        back: "Review back",
        deckId: deck.id,
        front: "Review front",
      });
      const card = getOnlyDeckCard(context, deck.id);

      const dueResponse = await context.app.request(`/reviews/due?deckId=${deck.id}`);
      const dueBody = (await dueResponse.json()) as PaginatedResponse<CardWithNote>;

      expect(dueResponse.status).toBe(200);
      expect(dueBody.data).toHaveLength(1);
      expect(dueBody.data[0]).toMatchObject({
        deckId: deck.id,
        front: "Review front",
        id: card.id,
        noteId: note.id,
      });

      const reviewResponse = await requestJson(context, `/reviews/${card.id}`, "POST", {
        value: 4,
      });
      const reviewBody = (await reviewResponse.json()) as ReviewResult;

      expect(reviewResponse.status).toBe(200);
      expect(reviewBody.card).toMatchObject({
        id: card.id,
        intervalDays: 1,
        repetitions: 1,
      });
      expect(reviewBody.nextDueAt).toBe(reviewBody.card.dueAt);

      const missingResponse = await requestJson(context, "/reviews/missing", "POST", {
        value: 4,
      });
      expect(missingResponse.status).toBe(404);
    } finally {
      context.cleanup();
    }
  });

  it("rejects invalid review bodies", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Review deck" });
      const note = context.repositories.createNote({
        back: "Back",
        deckId: deck.id,
        front: "Front",
      });
      const card = context.repositories.listDeckCards(deck.id)?.data.find((item) => {
        return item.noteId === note.id;
      });

      if (!card) {
        throw new Error("Expected test card to exist.");
      }

      const response = await context.app.request(`/reviews/${card.id}`, {
        body: JSON.stringify({ value: 6 }),
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
      });

      expect(response.status).toBe(400);
    } finally {
      context.cleanup();
    }
  });
});
