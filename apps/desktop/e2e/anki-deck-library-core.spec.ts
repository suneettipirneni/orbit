import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page);
});

test("ANKI-DECK-LIB-001 ANKI-DECK-LIB-003 ANKI-DECK-LIB-004 ANKI-DECK-LIB-005 ANKI-DECK-LIB-007: deck library shows counts, opens current decks, and creates decks", async ({
  page,
}) => {
  await page.goto("/");

  const deckLibrary = page.getByTestId("deck-library");
  await expect(deckLibrary.getByText("New", { exact: true })).toBeVisible();
  await expect(deckLibrary.getByText("Learn", { exact: true })).toBeVisible();
  await expect(deckLibrary.getByText("Review", { exact: true })).toBeVisible();
  const defaultRow = deckLibrary.getByTestId("deck-row-deck-1");
  await expect(defaultRow.getByRole("button", { exact: true, name: "Default" })).toBeVisible();
  await expect(defaultRow.getByText("New 1")).toBeVisible();
  await expect(defaultRow.getByText("Learn 0")).toBeVisible();
  await expect(defaultRow.getByText("Review 1")).toBeVisible();

  await deckLibrary.getByRole("button", { exact: true, name: "Default" }).click();
  await expect(page).toHaveURL(/\/decks\/deck-1$/);
  await expect(page.getByRole("heading", { level: 1, name: "Default" })).toBeVisible();
  await expect(deckLibrary.getByRole("button", { exact: true, name: "Default" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await deckLibrary.getByLabel("New deck").fill("Created From Library");
  await deckLibrary.getByRole("button", { name: "Create deck" }).click();
  await expect(
    deckLibrary.getByRole("button", { exact: true, name: "Created From Library" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/decks\/deck-3$/);
});
