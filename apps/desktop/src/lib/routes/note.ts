import { Hono } from "hono";
import type { CreateNoteInput, UpdateNoteInput } from "@orbit/api";
import type { Repositories } from "../repos/index.js";

export function createNoteRoutes(repositories: Repositories) {
  const app = new Hono();

  app.post("/", async (context) => {
    const input = await context.req.json<CreateNoteInput>();
    const note = repositories.createNote(input);
    return context.json(note, 201);
  });
  app.get("/:noteId", (context) => {
    const note = repositories.getNote(context.req.param("noteId"));
    return note ? context.json(note) : context.notFound();
  });
  app.patch("/:noteId", async (context) => {
    const input = await context.req.json<UpdateNoteInput>();
    const note = repositories.updateNote(context.req.param("noteId"), input);
    return note ? context.json(note) : context.notFound();
  });
  app.delete("/:noteId", (context) => {
    repositories.deleteNote(context.req.param("noteId"));
    return context.body(null, 204);
  });

  return app;
}
