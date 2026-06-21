import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-OVERVIEW-001 ANKI-DECK-OVERVIEW-002 ANKI-DECK-OVERVIEW-003 ANKI-DECK-OVERVIEW-004 ANKI-DECK-OVERVIEW-005: deck overview summarizes the deck and links to review", async ({
  page,
}) => {
  await mockOrbitApi(page, { description: "**Default deck**" });
  await page.goto("/decks/deck-1");

  await expect(page.getByRole("heading", { level: 1, name: "Default" })).toBeVisible();
  await expect(page.locator("strong", { hasText: "Default deck" })).toBeVisible();
  await expect(page.getByText("**Default deck**")).toBeHidden();
  await expect(page.getByText("Showing 2 of 2 cards")).toBeVisible();
  await expect(page.getByRole("row", { name: /Capital of France/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Largest planet/ })).toBeVisible();

  await expect(page.getByRole("link", { name: "Review" })).toHaveAttribute(
    "href",
    "/decks/deck-1/review",
  );
});

test.skip("ANKI-DECK-OVERVIEW-006: review route shows the finished state when no cards are due", async ({
  page,
}) => {
  await mockOrbitApi(page, { noDueCards: true });
  await page.goto("/decks/deck-1/review");

  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
  await expect(page.getByText("No cards are due.")).toBeVisible();
});

test.skip("ANKI-DECK-OVERVIEW-012: deck overview saves and displays an updated description", async ({
  page,
}) => {
  await mockOrbitApi(page, { description: "Default deck" });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Description" }).fill("Updated **deck notes**");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();

  await expect(page.locator("strong", { hasText: "deck notes" })).toBeVisible();
  await expect(page.getByText("Updated")).toBeVisible();
  await expect(page.getByText("Updated **deck notes**")).toBeHidden();
});
