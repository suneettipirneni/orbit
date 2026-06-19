import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, { includeBuriedCards: true });
});

test("ANKI-DECK-OVERVIEW-007 ANKI-DECK-OVERVIEW-008 ANKI-DECK-OVERVIEW-009 ANKI-DECK-OVERVIEW-010: deck overview opens deck actions and asks which buried cards to unbury", async ({
  page,
}) => {
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByRole("dialog", { name: "Deck Options" })).toContainText("Default");
  await page.getByRole("button", { name: "Close deck options" }).click();

  await page.getByRole("button", { name: "Custom Study" }).click();
  await expect(page.getByRole("dialog", { name: "Custom Study" })).toContainText("Default");
  await page.getByRole("button", { name: "Close custom study" }).click();

  await expect(page.getByRole("button", { name: "Unbury" })).toBeVisible();
  await page.getByRole("button", { name: "Unbury" }).click();

  const unburyDialog = page.getByRole("dialog", { name: "Unbury Cards" });
  await expect(unburyDialog).toBeVisible();
  await expect(unburyDialog.getByRole("button", { name: "Manually buried cards" })).toBeVisible();
  await expect(
    unburyDialog.getByRole("button", { name: "Scheduler-buried siblings" }),
  ).toBeVisible();
});
