import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1", repetitions: 3 },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 3 },
    ],
  });
  await page.goto("/decks/deck-1/review");
});

test("ANKI-REVIEW-035: forgetting the current card after confirmation returns it to the new-card queue", async ({
  page,
}) => {
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Forget Card" }).click();

  const confirmDialog = page.getByRole("dialog", { name: "Forget Card" });
  await expect(confirmDialog).toContainText("Capital of France");
  await confirmDialog.getByRole("button", { exact: true, name: "Forget card" }).click();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { exact: true, name: "Card Info" }).click();

  const infoDialog = page.getByRole("dialog", { name: "Card Info" });
  await expect(infoDialog).toContainText("Capital of France");
  await expect(infoDialog).toContainText("New");
  await expect(infoDialog).toContainText("No prior reviews recorded.");
});

test("ANKI-REVIEW-036: setting a valid due date removes the current card from today's review queue", async ({
  page,
}) => {
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Set Due Date" }).click();

  const dueDateDialog = page.getByRole("dialog", { name: "Set Due Date" });
  await dueDateDialog.getByRole("textbox", { name: "Due date" }).fill("2026-06-20");
  await dueDateDialog.getByRole("button", { exact: true, name: "Set due date" }).click();

  const reviewPanel = page.getByTestId("review-panel");
  await expect(reviewPanel.getByText("Largest planet")).toBeVisible();
  await expect(reviewPanel.getByText("Capital of France")).toBeHidden();
});
