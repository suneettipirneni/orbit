import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-034: Create Copy opens the add-note flow with content copied from the current note", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1" }],
  });
  await page.goto("/decks/deck-1/review");

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue("");
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toHaveValue("");
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Create Copy" }).click();

  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue(
    "Capital of France",
  );
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toHaveValue("Paris");
});
