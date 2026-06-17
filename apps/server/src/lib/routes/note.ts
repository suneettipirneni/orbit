import { Hono } from "hono";
import type { CreateNoteInput, UpdateNoteInput } from "@orbit/api";
import type { ApiEnv } from "./env.js";

const app = new Hono<ApiEnv>()
  .post("/", async (context) => {
    const input = await context.req.json<CreateNoteInput>();
    const note = context.var.repositories.createNote(input);
    return context.json(note, 201);
  })
  .get("/:noteId", (context) => {
    const note = context.var.repositories.getNote(context.req.param("noteId"));
    return note ? context.json(note) : context.notFound();
  })
  .patch("/:noteId", async (context) => {
    const input = await context.req.json<UpdateNoteInput>();
    const note = context.var.repositories.updateNote(context.req.param("noteId"), input);
    return note ? context.json(note) : context.notFound();
  })
  .delete("/:noteId", (context) => {
    context.var.repositories.deleteNote(context.req.param("noteId"));
    return context.body(null, 204);
  });

export default app;
export type NoteRoutes = typeof app;
