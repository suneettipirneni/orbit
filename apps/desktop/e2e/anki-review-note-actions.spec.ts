import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1", noteId: "note-shared" },
      { back: "France", front: "Paris is in which country?", id: "card-2", noteId: "note-shared" },
      { back: "Jupiter", front: "Largest planet", id: "card-3", noteId: "note-other" },
    ],
  });
  await page.goto("/decks/deck-1/review");
});

test("ANKI-REVIEW-012: burying the current note removes sibling cards from the active review queue", async ({
  page,
}) => {
  const reviewPanel = page.getByTestId("review-panel");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Bury Note" }).click();

  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
  await expect(reviewPanel.getByText("Paris is in which country?")).toBeHidden();
});

test("ANKI-REVIEW-014: suspending the current note removes sibling cards from normal review queues", async ({
  page,
}) => {
  const reviewPanel = page.getByTestId("review-panel");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Suspend Note" }).click();

  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
  await expect(reviewPanel.getByText("Paris is in which country?")).toBeHidden();
});
