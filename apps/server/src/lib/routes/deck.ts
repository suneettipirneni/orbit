import { Hono } from "hono";
import { isAnkiPackagePath, loadAnkiPackage } from "@orbit/anki";
import type { CreateDeckInput, UpdateDeckInput } from "@orbit/api";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { ApiEnv } from "./env.js";

const app = new Hono<ApiEnv>()
  .get("/", (context) => context.json(context.var.repositories.listDecks()))
  .post("/", async (context) => {
    const input = await context.req.json<CreateDeckInput>();
    return context.json(context.var.repositories.createDeck(input), 201);
  })
  .post("/import/anki", async (context) => {
    const body = await context.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      return context.text("Upload an Anki deck file in the 'file' form field.", 400);
    }

    if (!isSupportedAnkiFileName(file.name)) {
      return context.text("Unsupported Anki file format. Use .apkg, .colpkg, .anki2, or .anki21.", 400);
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
  })
  .get("/:deckId", (context) => {
    const deck = context.var.repositories.getDeck(context.req.param("deckId"));
    return deck ? context.json(deck) : context.notFound();
  })
  .patch("/:deckId", async (context) => {
    const input = await context.req.json<UpdateDeckInput>();
    const deck = context.var.repositories.updateDeck(context.req.param("deckId"), input);
    return deck ? context.json(deck) : context.notFound();
  })
  .delete("/:deckId", (context) => {
    context.var.repositories.deleteDeck(context.req.param("deckId"));
    return context.body(null, 204);
  });

export default app;
export type DeckRoutes = typeof app;

function isSupportedAnkiFileName(fileName: string) {
  return [".apkg", ".colpkg", ".anki2", ".anki21"].includes(extname(fileName).toLowerCase());
}
