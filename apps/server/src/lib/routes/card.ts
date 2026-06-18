import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod/v4";
import type { ApiEnv } from "./env.js";

const cardIdParamSchema = z
  .object({
    cardId: z.string().min(1),
  })
  .strict();

const app = new Hono<ApiEnv>();

app.get(
  "/:cardId",
  zValidator("param", cardIdParamSchema),
  (context) => {
    const { cardId } = context.req.valid("param");
    const card = context.var.repositories.getCard(cardId);

    return card ? context.json(card) : context.notFound();
  },
);

export default app;
export type CardRoutes = typeof app;
