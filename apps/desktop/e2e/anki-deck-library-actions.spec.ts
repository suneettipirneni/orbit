import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page);
});

test("ANKI-DECK-LIB-009 ANKI-DECK-LIB-012 ANKI-DECK-LIB-013 ANKI-DECK-LIB-014 ANKI-DECK-LIB-015 ANKI-DECK-LIB-016: deck row actions support options, rename, export, and delete", async ({
  page,
}) => {
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { exact: true, name: "Deck actions for Default" }).click();
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Options" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();

  await page.getByRole("menuitem", { name: "Options" }).click();
  await expect(page.getByRole("dialog", { name: "Deck Options" })).toContainText("Default");
  await page.getByRole("button", { name: "Close deck options" }).click();

  await page.getByRole("button", { exact: true, name: "Deck actions for Default" }).click();
  await page.getByRole("menuitem", { name: "Export" }).click();
  await expect(page.getByRole("dialog", { name: "Export Deck" })).toContainText("Default");
  await page.getByRole("button", { name: "Close export deck" }).click();

  await page.getByRole("button", { exact: true, name: "Deck actions for Default" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByLabel("Deck name").fill("Renamed Default");
  await page.getByRole("button", { name: "Save rename" }).click();
  await expect(page.getByRole("button", { exact: true, name: "Renamed Default" })).toBeVisible();

  await page.getByRole("button", { exact: true, name: "Deck actions for Renamed Default" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByLabel("Deck name").fill("");
  await expect(page.getByRole("button", { name: "Save rename" })).toBeDisabled();
  await page.getByRole("button", { name: "Close rename deck" }).click();
  await expect(page.getByRole("button", { exact: true, name: "Renamed Default" })).toBeVisible();

  await page.getByRole("button", { exact: true, name: "Deck actions for Renamed Default" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Delete Deck" });
  await expect(deleteDialog).toContainText("Renamed Default");
  await page.getByRole("button", { exact: true, name: "Delete deck" }).click();
  await expect(page.getByRole("button", { exact: true, name: "Renamed Default" })).toBeHidden();
  await expect(page.getByText("Deleted 2 cards with Renamed Default.")).toBeVisible();
});
