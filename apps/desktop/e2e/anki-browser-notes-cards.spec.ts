import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-048 ANKI-BROWSER-049 ANKI-BROWSER-050: Browser Add opens the Add Notes flow with selected note type and deck context", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Add note from browser" }).click();

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  await expect(addNoteForm).toBeVisible();
  await expect(addNoteForm.getByLabel("Note type")).toHaveValue("basic");
  await expect(addNoteForm.getByLabel("Deck")).toHaveValue("deck-1");
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue("");
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toBeFocused();
});

test("ANKI-BROWSER-051: Browser Create Copy opens Add Notes with copied note content", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Create copy from browser" }).click();

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue(
    "Capital of France",
  );
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toHaveValue("Paris");
});

test("ANKI-BROWSER-052: Browser Delete removes selected notes and their cards after confirmation", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Delete selected notes" }).click();
  await expect(page.getByRole("dialog", { name: "Delete Selected Notes" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm delete selected notes" }).click();

  await expect(page.getByRole("row", { name: /Capital of France/ })).toHaveCount(0);
});

test("ANKI-BROWSER-053: Browser Grade Now immediately grades selected cards", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("button", { name: "Grade now" }).click();

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
      { cardId: "card-1", rating: { value: 4 } },
      { cardId: "card-2", rating: { value: 4 } },
    ]);
});

test("ANKI-BROWSER-054 ANKI-BROWSER-055: Browser flag menu applies and clears user flags on selected cards", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("button", { name: "Flag card" }).click();
  await page.getByRole("menuitem", { name: "Red" }).click();
  await page.getByRole("button", { name: "Flag card" }).click();
  await page.getByRole("menuitem", { name: "Clear flag" }).click();

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
    .toEqual([
      { cardId: "card-1", input: { flag: 1 } },
      { cardId: "card-2", input: { flag: 1 } },
      { cardId: "card-1", input: { flag: 0 } },
      { cardId: "card-2", input: { flag: 0 } },
    ]);
});

test("ANKI-BROWSER-065 ANKI-BROWSER-066 ANKI-BROWSER-067 ANKI-BROWSER-068: Browser close saves dirty editor state, closes child windows, and sidebar focus restores hidden sidebar", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByTestId("browser-work-area")
    .getByRole("button", { name: "Toggle sidebar" })
    .click();
  await expect(page.getByRole("complementary", { name: "Browser sidebar panel" })).toBeHidden();
  await page.getByRole("button", { name: "Filter focus" }).click();
  await expect(page.getByRole("complementary", { name: "Browser sidebar panel" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Sidebar filter" })).toBeFocused();

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Preview selected card" }).click();
  await page.getByRole("button", { name: "Card info" }).click();
  await expect(page.getByRole("dialog", { name: "Card Preview" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Card Info" })).toBeVisible();

  await page.getByRole("textbox", { name: "Selected note front" }).fill("Saved before close");
  await page.getByRole("button", { name: "Close browser" }).click();

  await expect(page.getByRole("dialog", { name: "Card Preview" })).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Card Info" })).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __orbitNoteUpdates: Array<{ input: Record<string, unknown>; noteId: string }>;
            }
          ).__orbitNoteUpdates,
      ),
    )
    .toContainEqual({
      input: { back: "Paris", front: "Saved before close" },
      noteId: "note-1",
    });
});
