import { Hono } from "hono";
import type { CreateDeckInput, UpdateDeckInput } from "@orbit/api";
import type { Repositories } from "../repos/index.js";

export function createDeckRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/", (context) => context.json(repositories.listDecks()));
  app.post("/", async (context) => {
    const input = await context.req.json<CreateDeckInput>();
    return context.json(repositories.createDeck(input), 201);
  });
  app.get("/:deckId", (context) => {
    const deck = repositories.getDeck(context.req.param("deckId"));
    return deck ? context.json(deck) : context.notFound();
  });
  app.patch("/:deckId", async (context) => {
    const input = await context.req.json<UpdateDeckInput>();
    const deck = repositories.updateDeck(context.req.param("deckId"), input);
    return deck ? context.json(deck) : context.notFound();
  });
  app.delete("/:deckId", (context) => {
    repositories.deleteDeck(context.req.param("deckId"));
    return context.body(null, 204);
  });

  return app;
}
