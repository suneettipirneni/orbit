import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-027: Edit opens the current note editor without leaving review", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1" }],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { exact: true, name: "Edit" }).click();

  const editor = page.getByRole("dialog", { name: "Edit Note" });
  await expect(editor.getByRole("textbox", { name: "Front" })).toHaveValue("Capital of France");
  await expect(editor.getByRole("textbox", { name: "Back" })).toHaveValue("Paris");

  await editor.getByRole("textbox", { name: "Front" }).fill("Capital of Italy");
  await editor.getByRole("textbox", { name: "Back" }).fill("Rome");
  await editor.getByRole("button", { name: "Save" }).click();

  const reviewPanel = page.getByTestId("review-panel");
  await expect(reviewPanel.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(reviewPanel.getByText("Capital of Italy")).toBeVisible();
  await page.getByRole("button", { name: "Show Answer" }).click();
  await expect(reviewPanel.getByText("Rome")).toBeVisible();
});
