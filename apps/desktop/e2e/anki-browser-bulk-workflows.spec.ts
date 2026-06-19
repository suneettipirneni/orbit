import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-012: Clear Unused Tags removes tags not assigned to notes", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await expect(page.getByText("Tag list: science, unused")).toBeVisible();

  await page.getByRole("button", { name: "Clear unused tags" }).click();

  await expect(page.getByRole("dialog", { name: "Clear Unused Tags" })).toBeVisible();
  await expect(page.getByText("Removed: unused")).toBeVisible();
  await expect(page.getByText("Tag list: science")).toBeVisible();
});

test("ANKI-BROWSER-023: Change Note Type maps selected notes to the target type", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Change note type" }).click();
  await expect(page.getByRole("dialog", { name: "Change Note Type" })).toBeVisible();

  await page.getByRole("combobox", { name: "Target note type" }).selectOption("cloze");
  await page.getByRole("combobox", { name: "Front field mapping" }).selectOption("Text");
  await page.getByRole("button", { name: "Confirm note type change" }).click();

  await expect(page.getByText("note-1 -> Cloze")).toBeVisible();
  await expect(page.getByText("Front -> Text")).toBeVisible();
  await expect(page.getByText("Note type: Cloze")).toBeVisible();
});

test("ANKI-BROWSER-024: Find Duplicates reports duplicate note groups for a field", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "Answer one", front: "Shared term", id: "card-1", noteId: "note-1" },
      { back: "Answer two", front: "Shared term", id: "card-2", noteId: "note-2" },
      { back: "Answer three", front: "Unique term", id: "card-3", noteId: "note-3" },
    ],
  });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Find duplicates" }).click();
  await page.getByRole("combobox", { name: "Duplicate field" }).selectOption("front");
  await page.getByRole("button", { name: "Run duplicate search" }).click();

  const duplicateDialog = page.getByRole("dialog", { name: "Find Duplicates" });

  await expect(duplicateDialog).toBeVisible();
  await expect(duplicateDialog.getByText("Shared term: note-1, note-2")).toBeVisible();
  await expect(duplicateDialog.getByText("Unique term")).not.toBeVisible();
});

test("ANKI-BROWSER-025: Find and Replace updates matching selected note fields", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Find and replace" }).click();
  await page.getByRole("textbox", { name: "Find text" }).fill("Capital");
  await page.getByRole("textbox", { name: "Replacement text" }).fill("Capital city");
  await page.getByRole("button", { name: "Run find and replace" }).click();

  await expect(page.getByText("Replaced 1 field value.")).toBeVisible();
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
      input: { back: "Paris", front: "Capital city of France" },
      noteId: "note-1",
    });
});

test("ANKI-BROWSER-026: Export Notes opens with selected notes as scope", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Export notes" }).click();

  await expect(page.getByRole("dialog", { name: "Export Notes" })).toBeVisible();
  await expect(page.getByText("Scope: selected notes")).toBeVisible();
  await expect(page.getByText("note-1")).toBeVisible();
});

test("ANKI-BROWSER-027: Create Filtered Deck uses current search and selection context", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByPlaceholder("Search cards with Anki syntax...").fill("Capital");
  await page.keyboard.press("Enter");
  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Create filtered deck" }).click();

  await expect(page.getByRole("dialog", { name: "Create Filtered Deck" })).toBeVisible();
  await expect(page.getByText("Search: Capital")).toBeVisible();
  await expect(page.getByText("Selected cards: card-1")).toBeVisible();
});
