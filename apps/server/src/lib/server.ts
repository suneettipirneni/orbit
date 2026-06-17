import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { Hono } from "hono";
import type { Repositories } from "./repos/index.js";
import routes from "./routes/index.js";
import type { ApiEnv } from "./routes/env.js";

export interface ApiServer {
  close(): void;
  port: number;
}

export function startApiServer(repositories: Repositories, port = 3737): ApiServer {
  const app = new Hono<ApiEnv>();

  app.use("*", async (context, next) => {
    context.set("repositories", repositories);
    await next();
  });
  app.route("/", routes);

  const server: ServerType = serve({
    fetch: app.fetch,
    hostname: "127.0.0.1",
    port,
  });

  return {
    close() {
      server.close();
    },
    port,
  };
}
