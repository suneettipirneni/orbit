import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import type { Repositories } from "./repos/index.js";
import { createApiApp } from "./routes/index.js";

export interface ApiServer {
  close(): void;
  port: number;
}

export function startApiServer(repositories: Repositories, port = 3737): ApiServer {
  const app = createApiApp(repositories);
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
