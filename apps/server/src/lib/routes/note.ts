import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createNoteInputSchema, updateNoteInputSchema } from "@orbit/api";
import * as z from "zod/v4";
import type { ApiEnv } from "./env.js";

const noteIdParamSchema = z
  .object({
    noteId: z.string().min(1),
  })
  .strict();

const app = new Hono<ApiEnv>();

app.post("/", zValidator("json", createNoteInputSchema), (context) => {
  const input = context.req.valid("json");
  const note = context.var.repositories.createNote(input);
  return context.json(note, 201);
});

app.get("/:noteId", zValidator("param", noteIdParamSchema), (context) => {
  const { noteId } = context.req.valid("param");
  const note = context.var.repositories.getNote(noteId);
  return note ? context.json(note) : context.notFound();
});

app.patch(
  "/:noteId",
  zValidator("param", noteIdParamSchema),
  zValidator("json", updateNoteInputSchema),
  (context) => {
    const { noteId } = context.req.valid("param");
    const input = context.req.valid("json");
    const note = context.var.repositories.updateNote(noteId, input);
    return note ? context.json(note) : context.notFound();
  },
);

app.delete("/:noteId", zValidator("param", noteIdParamSchema), (context) => {
  const { noteId } = context.req.valid("param");
  context.var.repositories.deleteNote(noteId);
  return context.body(null, 204);
});

export default app;
export type NoteRoutes = typeof app;
