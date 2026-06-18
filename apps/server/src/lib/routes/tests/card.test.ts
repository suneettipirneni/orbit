import type { CardWithNote } from "@orbit/api";
import { describe, expect, it } from "vitest";
import { createTestContext, getOnlyDeckCard } from "./helpers.js";

describe("card routes", () => {
  it("returns cards by id", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Card lookup deck" });
      const note = context.repositories.createNote({
        back: "Card back",
        deckId: deck.id,
        front: "Card front",
      });
      const card = getOnlyDeckCard(context, deck.id);

      const response = await context.app.request(`/cards/${card.id}`);
      const body = (await response.json()) as CardWithNote;

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        back: "Card back",
        deckId: deck.id,
        deckName: "Card lookup deck",
        front: "Card front",
        id: card.id,
        noteId: note.id,
      });

      const missingResponse = await context.app.request("/cards/missing");
      expect(missingResponse.status).toBe(404);
    } finally {
      context.cleanup();
    }
  });
});
