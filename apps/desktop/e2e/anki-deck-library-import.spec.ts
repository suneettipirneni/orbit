import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-LIB-008: import file workflow starts without changing the selected deck", async ({
  page,
}) => {
  await mockOrbitApi(page, { importDelayMs: 500 });
  await page.goto("/decks/deck-1");

  const deckLibrary = page.getByTestId("deck-library");

  await expect(page).toHaveURL(/\/decks\/deck-1$/);

  await deckLibrary.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from("placeholder anki package"),
    mimeType: "application/octet-stream",
    name: "collection.apkg",
  });

  await expect(deckLibrary.getByRole("button", { name: "Importing..." })).toBeVisible();
  await expect(page).toHaveURL(/\/decks\/deck-1$/);
});
