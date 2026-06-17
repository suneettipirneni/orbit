import { describe, expect, it } from "vitest";
import app from "./index.js";

describe("api routes", () => {
  it("serves HEAD requests through GET route handling", async () => {
    const getResponse = await app.request("/health");
    const headResponse = await app.request("/health", { method: "HEAD" });

    expect(headResponse.status).toBe(getResponse.status);
    expect(headResponse.headers.get("content-type")).toBe(getResponse.headers.get("content-type"));
    expect(headResponse.body).toBeNull();
  });
});
