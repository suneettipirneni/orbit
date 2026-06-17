import { Hono } from "hono";
import type { Repositories } from "../repos/index.js";

export function createReviewRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/due", (context) =>
    context.json(repositories.listDueCards(context.req.query("deckId") || undefined)),
  );
  app.post("/:cardId", async (context) => {
    const body = await context.req.json<{ value: 1 | 2 | 3 | 4 | 5 }>();
    const card = repositories.submitReview(context.req.param("cardId"), body.value);
    return card
      ? context.json({
          card,
          nextDueAt: card.dueAt,
        })
      : context.notFound();
  });

  return app;
}
