import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-OVERVIEW-001 ANKI-DECK-OVERVIEW-002 ANKI-DECK-OVERVIEW-003 ANKI-DECK-OVERVIEW-004 ANKI-DECK-OVERVIEW-005: deck overview summarizes the deck and starts review with Study Now", async ({
  page,
}) => {
  await mockOrbitApi(page, { description: "**Default deck**" });
  await page.goto("/decks/deck-1");

  await expect(page.getByRole("heading", { level: 1, name: "Default" })).toBeVisible();
  await expect(page.locator("strong", { hasText: "Default deck" })).toBeVisible();
  await expect(page.getByText("**Default deck**")).toBeHidden();
  const overviewCounts = page.getByTestId("deck-overview-counts");
  await expect(overviewCounts.getByText("New", { exact: true })).toBeVisible();
  await expect(overviewCounts.getByText("Learning", { exact: true })).toBeVisible();
  await expect(overviewCounts.getByText("To Review", { exact: true })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
  await page.getByRole("button", { name: "Study Now" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show Answer" })).toBeVisible();
});

test("ANKI-DECK-OVERVIEW-006: deck overview shows the finished state instead of opening review when no cards are due", async ({
  page,
}) => {
  await mockOrbitApi(page, { noDueCards: true });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Study Now" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
  await expect(page.getByText("No cards are due.")).toBeVisible();
});

test("ANKI-DECK-OVERVIEW-012: deck overview saves and displays an updated description", async ({
  page,
}) => {
  await mockOrbitApi(page, { description: "Default deck" });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { exact: true, name: "Description" }).click();
  await page.getByRole("textbox", { name: "Deck description" }).fill("Updated **deck notes**");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator("strong", { hasText: "deck notes" })).toBeVisible();
  await expect(page.getByText("Updated")).toBeVisible();
  await expect(page.getByText("Updated **deck notes**")).toBeHidden();
});
