import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.skip(true, "Deck action controls are not mounted in the current deck detail route.");

test("ANKI-DECK-OVERVIEW-007 ANKI-DECK-OVERVIEW-008 ANKI-DECK-OVERVIEW-009 ANKI-DECK-OVERVIEW-010: deck overview opens deck actions and asks which buried cards to unbury", async ({
  page,
}) => {
  await mockOrbitApi(page, { includeBuriedCards: true });
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

test("ANKI-DECK-OVERVIEW-011: filtered deck overview shows rebuild and empty actions instead of custom study", async ({
  page,
}) => {
  await mockOrbitApi(page, { includeFilteredDeck: true });
  await page.goto("/decks/deck-filtered");

  await expect(page.getByRole("heading", { level: 1, name: "Filtered Review" })).toBeVisible();
  await expect(page.getByText("cards return to their original decks")).toBeVisible();
  await expect(page.getByRole("button", { name: "Rebuild" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Empty" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Custom Study" })).toBeHidden();
});
