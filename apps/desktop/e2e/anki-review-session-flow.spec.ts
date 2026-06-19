import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-006 ANKI-REVIEW-007: rating records the answer, advances, and exits when the queue is empty", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1" },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 3 },
    ],
  });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Study Now" }).click();
  await expect(page.getByText("Capital of France").first()).toBeVisible();

  await page.getByRole("button", { name: "Show Answer" }).click();
  await expect(page.getByText("Paris")).toBeVisible();
  await page.getByRole("button", { name: "Good" }).click();

  await expect(page.getByText("Largest planet").first()).toBeVisible();
  await page.getByRole("button", { name: "Show Answer" }).click();
  await expect(page.getByText("Jupiter")).toBeVisible();
  await page.getByRole("button", { name: "Good" }).click();

  await expect(page.getByRole("heading", { name: "Congratulations" })).toBeVisible();
  await expect(page.getByText("No cards are due.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
});
