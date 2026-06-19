import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1" },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 3 },
    ],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();
});

test("ANKI-REVIEW-031 ANKI-REVIEW-033: card info opens for the current card and previous card info is unavailable before a review", async ({
  page,
}) => {
  await page.getByRole("button", { name: "More review actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Previous Card Info" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.getByRole("menuitem", { exact: true, name: "Card Info" }).click();

  const dialog = page.getByRole("dialog", { name: "Card Info" });
  await expect(dialog).toContainText("Capital of France");
  await expect(dialog).toContainText("card-1");
  await expect(dialog).toContainText("note-1");
});

test("ANKI-REVIEW-032: previous card info opens metadata for the last reviewed card", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Show Answer" }).click();
  await page.getByRole("button", { name: "Good" }).click();
  await expect(page.getByTestId("review-panel").getByText("Largest planet")).toBeVisible();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Previous Card Info" }).click();

  const dialog = page.getByRole("dialog", { name: "Previous Card Info" });
  await expect(dialog).toContainText("Capital of France");
  await expect(dialog).toContainText("card-1");
  await expect(dialog).not.toContainText("Largest planet");
});
