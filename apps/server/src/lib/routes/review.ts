import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { reviewRatingSchema } from "@orbit/api";
import * as z from "zod/v4";
import { parsePaginationQuery } from "../pagination.js";
import type { ApiEnv } from "./env.js";

const cardIdParamSchema = z
  .object({
    cardId: z.string().min(1),
  })
  .strict();

const app = new Hono<ApiEnv>();

app.get("/due", (context) => {
  const pagination = parsePaginationQuery(context.req.query.bind(context.req));

  return context.json(
    context.var.repositories.listDueCards({
      deckId: context.req.query("deckId") || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  );
});

app.post(
  "/:cardId",
  zValidator("param", cardIdParamSchema),
  zValidator("json", reviewRatingSchema),
  (context) => {
    const { cardId } = context.req.valid("param");
    const body = context.req.valid("json");
    const card = context.var.repositories.submitReview(cardId, body.value);
    return card
      ? context.json({
          card,
          nextDueAt: card.dueAt,
        })
      : context.notFound();
  },
);

export default app;
export type ReviewRoutes = typeof app;
