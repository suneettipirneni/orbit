import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-015: deleting the current note removes its cards from the review queue after confirmation", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1", noteId: "note-shared" },
      { back: "France", front: "Paris is in which country?", id: "card-2", noteId: "note-shared" },
      { back: "Jupiter", front: "Largest planet", id: "card-3", noteId: "note-other" },
    ],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();

  const reviewPanel = page.getByTestId("review-panel");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Delete Note" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Delete Note" });
  await expect(deleteDialog).toContainText("Capital of France");

  await deleteDialog.getByRole("button", { exact: true, name: "Delete note" }).click();

  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
  await expect(reviewPanel.getByText("Paris is in which country?")).toBeHidden();
});
