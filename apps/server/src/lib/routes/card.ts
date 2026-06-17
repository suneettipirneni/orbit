import { Hono } from "hono";
import type { ApiEnv } from "./env.js";

const app = new Hono<ApiEnv>().get("/:cardId", (context) => {
  const card = context.var.repositories.getCard(context.req.param("cardId"));
  return card ? context.json(card) : context.notFound();
});

export default app;
export type CardRoutes = typeof app;
