import { Hono } from "hono";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../../database.js";
import { createRepositories } from "../../repos/index.js";
import type { ApiEnv } from "../env.js";
import routes from "../index.js";

export function createTestContext() {
  const directory = mkdtempSync(join(tmpdir(), "orbit-api-routes-"));
  const handle = createDatabase(join(directory, "orbit.sqlite"));
  const repositories = createRepositories(handle);
  const app = new Hono<ApiEnv>();

  app.use("*", async (context, next) => {
    context.set("repositories", repositories);
    await next();
  });
  app.route("/", routes);

  return {
    app,
    cleanup() {
      handle.sqlite.close();
      rmSync(directory, { force: true, recursive: true });
    },
    repositories,
  };
}

export type TestContext = ReturnType<typeof createTestContext>;

export function requestJson(context: TestContext, path: string, method: string, body: unknown) {
  return context.app.request(path, {
    body: JSON.stringify(body),
    headers: new Headers({ "Content-Type": "application/json" }),
    method,
  });
}

export function getOnlyDeckCard(context: TestContext, deckId: string) {
  const card = context.repositories.listDeckCards(deckId)?.data[0];

  if (!card) {
    throw new Error("Expected test card to exist.");
  }

  return card;
}
