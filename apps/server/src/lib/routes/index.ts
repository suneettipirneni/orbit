import { Hono } from "hono";
import { cors } from "hono/cors";
import cardRoutes from "./card.js";
import deckRoutes from "./deck.js";
import type { ApiEnv } from "./env.js";
import noteRoutes from "./note.js";
import reviewRoutes from "./review.js";

const app = new Hono<ApiEnv>();

app.use("*", cors());
app.get("/health", (context) => context.json({ ok: true }));
app.route("/cards", cardRoutes);
app.route("/decks", deckRoutes);
app.route("/notes", noteRoutes);
app.route("/reviews", reviewRoutes);

export default app;
export type ApiApp = typeof app;
