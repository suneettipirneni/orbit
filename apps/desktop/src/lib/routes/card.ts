import { Hono } from "hono";
import type { Repositories } from "../repos/index.js";

export function createCardRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/:cardId", (context) => {
    const card = repositories.getCard(context.req.param("cardId"));
    return card ? context.json(card) : context.notFound();
  });

  return app;
}
