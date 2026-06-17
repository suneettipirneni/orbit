import { Hono } from "hono";
import type { Repositories } from "../repos/index.js";
import { createCardRoutes } from "./card.js";
import { createDeckRoutes } from "./deck.js";
import { createNoteRoutes } from "./note.js";
import { createReviewRoutes } from "./review.js";

export function createApiApp(repositories: Repositories) {
  const app = new Hono();

  app.get("/health", (context) => context.json({ ok: true }));
  app.route("/cards", createCardRoutes(repositories));
  app.route("/decks", createDeckRoutes(repositories));
  app.route("/notes", createNoteRoutes(repositories));
  app.route("/reviews", createReviewRoutes(repositories));

  return app;
}
