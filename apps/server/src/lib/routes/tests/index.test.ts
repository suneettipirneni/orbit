import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers.js";

describe("index routes", () => {
  it("serves health checks", async () => {
    const context = createTestContext();

    try {
      const response = await context.app.request("/health");
      const body = (await response.json()) as { ok: boolean };

      expect(response.status).toBe(200);
      expect(body).toEqual({ ok: true });
    } finally {
      context.cleanup();
    }
  });

  it("serves HEAD requests through GET route handling", async () => {
    const context = createTestContext();

    try {
      const getResponse = await context.app.request("/health");
      const headResponse = await context.app.request("/health", { method: "HEAD" });

      expect(headResponse.status).toBe(getResponse.status);
      expect(headResponse.headers.get("content-type")).toBe(
        getResponse.headers.get("content-type"),
      );
      expect(headResponse.body).toBeNull();
    } finally {
      context.cleanup();
    }
  });
});
