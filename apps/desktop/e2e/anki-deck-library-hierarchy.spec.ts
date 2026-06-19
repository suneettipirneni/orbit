import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, {
    childDeckCounts: {
      learningCards: 1,
      newCards: 2,
      reviewCards: 3,
    },
  });
});

test("ANKI-DECK-LIB-002 ANKI-DECK-LIB-006: parent decks aggregate child counts and toggle child rows", async ({
  page,
}) => {
  await page.goto("/");

  const deckLibrary = page.getByTestId("deck-library");
  const defaultRow = deckLibrary.getByTestId("deck-row-deck-1");
  const biologyRow = deckLibrary.getByTestId("deck-row-deck-2");

  await expect(defaultRow.getByText("New 3")).toBeVisible();
  await expect(defaultRow.getByText("Learn 1")).toBeVisible();
  await expect(defaultRow.getByText("Review 4")).toBeVisible();
  await expect(biologyRow.getByRole("button", { exact: true, name: "Biology" })).toBeVisible();

  await defaultRow.getByRole("button", { name: "Collapse Default" }).click();

  await expect(biologyRow).toBeHidden();

  await defaultRow.getByRole("button", { name: "Expand Default" }).click();

  await expect(biologyRow).toBeVisible();
});
