import { describe, expect, it } from "vitest";
import { scheduleReview } from "./scheduler.js";

describe("scheduleReview", () => {
  it("graduates new cards after a passing review", () => {
    const result = scheduleReview(
      {
        dueAt: "2026-06-16T00:00:00.000Z",
        easeFactor: 2.5,
        intervalDays: 0,
        lapses: 0,
        repetitions: 0,
      },
      4,
      new Date("2026-06-16T00:00:00.000Z"),
    );

    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.nextDueAt).toBe("2026-06-17T00:00:00.000Z");
  });

  it("resets failed cards and tracks lapses", () => {
    const result = scheduleReview(
      {
        dueAt: "2026-06-16T00:00:00.000Z",
        easeFactor: 2.5,
        intervalDays: 8,
        lapses: 0,
        repetitions: 3,
      },
      1,
      new Date("2026-06-16T00:00:00.000Z"),
    );

    expect(result.intervalDays).toBe(1);
    expect(result.lapses).toBe(1);
    expect(result.repetitions).toBe(0);
  });
});
