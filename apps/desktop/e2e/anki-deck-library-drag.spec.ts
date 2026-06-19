import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, { includeDragTargetDeck: true });
});

test("ANKI-DECK-LIB-010: dragging one deck onto another makes it a child of the target deck", async ({
  page,
}) => {
  await page.goto("/");

  const deckLibrary = page.getByTestId("deck-library");
  const biologyRow = deckLibrary.getByTestId("deck-row-deck-2");
  const chemistryRow = deckLibrary.getByTestId("deck-row-deck-3");

  await biologyRow.dragTo(chemistryRow);

  await expect(
    biologyRow.getByRole("button", { exact: true, name: "Deck actions for Chemistry::Biology" }),
  ).toBeVisible();
  await expect(chemistryRow.getByRole("button", { name: "Collapse Chemistry" })).toBeVisible();

  await chemistryRow.getByRole("button", { name: "Collapse Chemistry" }).click();

  await expect(biologyRow).toBeHidden();
});

test("ANKI-DECK-LIB-017: dragging a child deck to the top-level drag row makes it top-level", async ({
  page,
}) => {
  await page.goto("/");

  const deckLibrary = page.getByTestId("deck-library");
  const defaultRow = deckLibrary.getByTestId("deck-row-deck-1");
  const biologyRow = deckLibrary.getByTestId("deck-row-deck-2");

  await biologyRow.dragTo(deckLibrary.getByTestId("deck-top-level-drop-target"));

  await expect(
    biologyRow.getByRole("button", { exact: true, name: "Deck actions for Biology" }),
  ).toBeVisible();

  await expect(defaultRow.getByRole("button", { name: "Collapse Default" })).toBeHidden();
  await expect(biologyRow).toBeVisible();
});
