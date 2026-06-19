import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-029: toggling Mark Note marks the current note and updates the review indicator", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1", noteTags: [] }],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Mark Note" }).click();

  await expect(page.getByLabel("Review mark")).toHaveText("Marked");
});

test("ANKI-REVIEW-030: toggling Mark Note on a marked card unmarks the note and updates the review indicator", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      {
        back: "Paris",
        front: "Capital of France",
        id: "card-1",
        noteTags: ["marked"],
      },
    ],
  });
  await page.goto("/decks/deck-1");
  await page.getByRole("button", { name: "Study Now" }).click();
  await expect(page.getByLabel("Review mark")).toHaveText("Marked");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Unmark Note" }).click();

  await expect(page.getByLabel("Review mark")).toBeHidden();
});
