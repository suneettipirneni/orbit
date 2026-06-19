import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-048 ANKI-REVIEW-049: timebox prompt appears and Continue starts a new interval", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1", repetitions: 1 }],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Timebox 1s" }).click();

  await expect(page.getByRole("dialog", { name: "Timebox" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("dialog", { name: "Timebox" })).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Timebox" })).toBeVisible();
});

test("ANKI-REVIEW-050: timebox Finish exits review and shows the deck browser", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1", repetitions: 1 }],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Timebox 1s" }).click();

  await expect(page.getByRole("dialog", { name: "Timebox" })).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page.getByRole("heading", { name: "Congratulations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
});
