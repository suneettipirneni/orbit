import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { isAnkiPackagePath, loadAnkiPackage } from "@orbit/anki";
import { createDeckInputSchema, updateDeckInputSchema } from "@orbit/api";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import * as z from "zod/v4";
import { parsePaginationQuery } from "../pagination.js";
import type { ApiEnv } from "./env.js";

const deckIdParamSchema = z
  .object({
    deckId: z.string().min(1),
  })
  .strict();

const app = new Hono<ApiEnv>();

app.get("/", (context) =>
  context.json(
    context.var.repositories.listDecks(parsePaginationQuery(context.req.query.bind(context.req))),
  ),
);

app.post("/", zValidator("json", createDeckInputSchema), (context) => {
  const input = context.req.valid("json");
  return context.json(context.var.repositories.createDeck(input), 201);
});

app.post("/import/anki", async (context) => {
  const body = await context.req.parseBody();
  const file = body.file;

  if (!(file instanceof File)) {
    return context.text("Upload an Anki deck file in the 'file' form field.", 400);
  }

  if (!isSupportedAnkiFileName(file.name)) {
    return context.text(
      "Unsupported Anki file format. Use .apkg, .colpkg, .anki2, or .anki21.",
      400,
    );
  }

  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-upload-"));
  const filePath = join(workdir, `import${extname(file.name).toLowerCase()}`);

  try {
    writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

    if (!isAnkiPackagePath(filePath)) {
      return context.text("Uploaded file is not a supported Anki deck format.", 400);
    }

    const result = context.var.repositories.importAnkiDecks(loadAnkiPackage(filePath));

    if (result.deckCount === 0) {
      return context.text("No importable Anki cards were found in this file.", 400);
    }

    return context.json(result, 201);
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
});

app.get("/:deckId/cards", zValidator("param", deckIdParamSchema), (context) => {
  const { deckId } = context.req.valid("param");
  const pagination = parsePaginationQuery(context.req.query.bind(context.req));
  const cards = context.var.repositories.listDeckCards(deckId, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    query: context.req.query("query") || undefined,
  });

  return cards ? context.json(cards) : context.notFound();
});

app.get("/:deckId/note-types", zValidator("param", deckIdParamSchema), (context) => {
  const { deckId } = context.req.valid("param");
  const noteTypes = context.var.repositories.listDeckNoteTypes(
    deckId,
    parsePaginationQuery(context.req.query.bind(context.req)),
  );

  return noteTypes ? context.json(noteTypes) : context.notFound();
});

app.get("/:deckId/card-types", zValidator("param", deckIdParamSchema), (context) => {
  const { deckId } = context.req.valid("param");
  const cardTypes = context.var.repositories.listDeckCardTypes(
    deckId,
    parsePaginationQuery(context.req.query.bind(context.req)),
  );

  return cardTypes ? context.json(cardTypes) : context.notFound();
});

app.get("/:deckId", zValidator("param", deckIdParamSchema), (context) => {
  const { deckId } = context.req.valid("param");
  const deck = context.var.repositories.getDeck(deckId);
  return deck ? context.json(deck) : context.notFound();
});

app.patch(
  "/:deckId",
  zValidator("param", deckIdParamSchema),
  zValidator("json", updateDeckInputSchema),
  (context) => {
    const { deckId } = context.req.valid("param");
    const input = context.req.valid("json");
    const deck = context.var.repositories.updateDeck(deckId, input);
    return deck ? context.json(deck) : context.notFound();
  },
);

app.delete("/:deckId", zValidator("param", deckIdParamSchema), (context) => {
  const { deckId } = context.req.valid("param");
  context.var.repositories.deleteDeck(deckId);
  return context.body(null, 204);
});

export default app;
export type DeckRoutes = typeof app;

function isSupportedAnkiFileName(fileName: string) {
  return [".apkg", ".colpkg", ".anki2", ".anki21"].includes(extname(fileName).toLowerCase());
}
