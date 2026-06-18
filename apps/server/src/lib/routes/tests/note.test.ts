import type { Note } from "@orbit/api";
import { describe, expect, it } from "vitest";
import { createTestContext, requestJson } from "./helpers.js";

describe("note routes", () => {
  it("creates, reads, updates, and deletes notes", async () => {
    const context = createTestContext();

    try {
      const deck = context.repositories.createDeck({ name: "Note deck" });
      const createResponse = await requestJson(context, "/notes", "POST", {
        back: "Original back",
        deckId: deck.id,
        front: "Original front",
      });
      const created = (await createResponse.json()) as Note;

      expect(createResponse.status).toBe(201);
      expect(created).toMatchObject({
        back: "Original back",
        deckId: deck.id,
        front: "Original front",
      });

      const getResponse = await context.app.request(`/notes/${created.id}`);
      const getBody = (await getResponse.json()) as Note;

      expect(getResponse.status).toBe(200);
      expect(getBody).toEqual(created);

      const updateResponse = await requestJson(context, `/notes/${created.id}`, "PATCH", {
        back: "Updated back",
        front: "Updated front",
      });
      const updated = (await updateResponse.json()) as Note;

      expect(updateResponse.status).toBe(200);
      expect(updated).toMatchObject({
        back: "Updated back",
        deckId: deck.id,
        front: "Updated front",
        id: created.id,
      });

      const missingUpdateResponse = await requestJson(context, "/notes/missing", "PATCH", {
        front: "Missing",
      });
      expect(missingUpdateResponse.status).toBe(404);

      const deleteResponse = await context.app.request(`/notes/${created.id}`, {
        method: "DELETE",
      });
      expect(deleteResponse.status).toBe(204);

      const deletedResponse = await context.app.request(`/notes/${created.id}`);
      expect(deletedResponse.status).toBe(404);
    } finally {
      context.cleanup();
    }
  });
});
