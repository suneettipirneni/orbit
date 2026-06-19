import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-LIB-011: deck library shows today's studied card count and elapsed review time", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    todayStudySummary: {
      elapsedSeconds: 125,
      studiedCards: 3,
    },
  });
  await page.goto("/");

  const summary = page.getByTestId("studied-today-summary");

  await expect(summary).toContainText("3 cards");
  await expect(summary).toContainText("studied today");
  await expect(summary).toContainText("2m 5s review time");
});
