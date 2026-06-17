import { Hono } from "hono";
import type { ApiEnv } from "./env.js";

const app = new Hono<ApiEnv>()
  .get("/due", (context) =>
    context.json(context.var.repositories.listDueCards(context.req.query("deckId") || undefined)),
  )
  .post("/:cardId", async (context) => {
    const body = await context.req.json<{ value: 1 | 2 | 3 | 4 | 5 }>();
    const card = context.var.repositories.submitReview(context.req.param("cardId"), body.value);
    return card
      ? context.json({
          card,
          nextDueAt: card.dueAt,
        })
      : context.notFound();
  });

export default app;
export type ReviewRoutes = typeof app;
