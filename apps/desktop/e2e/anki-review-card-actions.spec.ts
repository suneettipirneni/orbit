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

test("ANKI-REVIEW-010: applying a flag color updates the current card flag indicator", async ({
  page,
}) => {
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Flag red" }).click();

  await expect(page.getByText("Red flag")).toBeVisible();
  await expect(page.getByText("Capital of France").first()).toBeVisible();
});

test("ANKI-REVIEW-011: burying the current card removes it from the active review queue", async ({
  page,
}) => {
  const reviewPanel = page.getByTestId("review-panel");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Bury Card" }).click();

  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
});

test("ANKI-REVIEW-013: suspending the current card removes it from normal review queues", async ({
  page,
}) => {
  const reviewPanel = page.getByTestId("review-panel");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Suspend Card" }).click();

  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
});
