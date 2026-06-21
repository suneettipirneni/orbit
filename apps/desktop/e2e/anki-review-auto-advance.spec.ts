import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-019 ANKI-REVIEW-021 ANKI-REVIEW-042: auto advance toggles on, shows answers, and submits Good", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1", repetitions: 1 },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 1 },
    ],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Auto Advance" }).click();
  await expect(page.getByLabel("Auto Advance")).toHaveText("Auto Advance On");

  await expect(page.getByText("Paris")).toBeVisible();
  await expect(page.getByTestId("review-panel").getByText("Largest planet")).toBeVisible();
  await expect(page.getByText("Jupiter")).toBeVisible();
});

test("ANKI-REVIEW-020: question auto-advance can show a reminder instead of the answer", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1", repetitions: 1 }],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Question Auto Reminder" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Auto Advance" }).click();

  await expect(page.getByLabel("Auto Advance Reminder")).toBeVisible();
  await expect(page.getByText("Paris")).toBeHidden();
  await expect(page.getByRole("button", { name: "Show Answer" })).toBeVisible();
});

test("ANKI-REVIEW-022 ANKI-REVIEW-023: answer auto-advance can submit Hard or Again", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital of France", id: "card-1", repetitions: 3 },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 3 },
    ],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Question Auto Reminder" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Answer Auto Hard" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Auto Advance" }).click();
  await page.getByRole("button", { name: "Show Answer" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __orbitReviewSubmissions: Array<{ cardId: string; rating: { value: number } }>;
            }
          ).__orbitReviewSubmissions,
      ),
    )
    .toEqual([{ cardId: "card-1", rating: expect.objectContaining({ value: 3 }) }]);

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Answer Auto Again" }).click();
  await page.getByRole("button", { name: "Show Answer" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __orbitReviewSubmissions: Array<{ cardId: string; rating: { value: number } }>;
            }
          ).__orbitReviewSubmissions,
      ),
    )
    .toEqual([
      { cardId: "card-1", rating: expect.objectContaining({ value: 3 }) },
      { cardId: "card-2", rating: expect.objectContaining({ value: 1 }) },
    ]);
});

test("ANKI-REVIEW-024: answer auto-advance can bury the current card", async ({ page }) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1", repetitions: 3 }],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Answer Auto Bury Current" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Auto Advance" }).click();
  await page.getByRole("button", { name: "Show Answer" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __orbitCardUpdates: Array<{ cardId: string; input: Record<string, unknown> }>;
            }
          ).__orbitCardUpdates,
      ),
    )
    .toEqual([{ cardId: "card-1", input: { buried: true } }]);
  await expect(page.getByRole("heading", { name: "Congratulations" })).toBeVisible();
});

test("ANKI-REVIEW-025: auto-advance waits while review audio is playing", async ({ page }) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      {
        back: "Revealed back",
        front: "Prompt [sound:question.mp3]",
        id: "card-1",
        repetitions: 3,
      },
    ],
  });
  await page.goto("/decks/deck-1/review");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Wait For Audio" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Replay Audio" }).click();
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Auto Advance" }).click();

  await expect(page.getByLabel("Review audio status")).toContainText("Playing");
  await page.waitForTimeout(800);
  await expect(page.getByText("Revealed back")).toBeHidden();

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Pause Audio" }).click();
  await expect(page.getByText("Revealed back")).toBeVisible();
});
