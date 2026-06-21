import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DUPES-001 ANKI-DUPES-002 ANKI-DUPES-003 ANKI-DUPES-004: duplicate search constrains, links, and tags duplicate notes", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "Answer one", front: "Shared term", id: "card-1", noteId: "note-1" },
      { back: "Answer two", front: "Shared term", id: "card-2", noteId: "note-2" },
      { back: "Answer three", front: "Other shared", id: "card-3", noteId: "note-3" },
    ],
  });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Find duplicates" }).click();

  const dialog = page.getByRole("dialog", { name: "Find Duplicates" });
  await expect(dialog.getByRole("combobox", { name: "Duplicate field" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Duplicate search constraint" })).toBeVisible();

  await dialog.getByRole("textbox", { name: "Duplicate search constraint" }).fill("Shared");
  await dialog.getByRole("button", { name: "Run duplicate search" }).click();
  await expect(dialog.getByText("Shared term: 2 notes")).toBeVisible();
  await dialog.getByRole("button", { name: "Tag duplicates" }).click();
  await expect(dialog.getByText("Tagged duplicates: note-1, note-2")).toBeVisible();

  await dialog.getByRole("button", { name: "Search duplicate group Shared term" }).click();
  await expect(page.getByText("nid:note-1,note-2")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Note rows" })).toBeChecked();
});

test("ANKI-FIND-REPLACE-001 ANKI-FIND-REPLACE-002 ANKI-FIND-REPLACE-003: find and replace respects selected scope and field selection", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "alpha back", front: "alpha front", id: "card-1", noteId: "note-1" },
      { back: "alpha back", front: "alpha front", id: "card-2", noteId: "note-2" },
    ],
  });
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /card-1|alpha front/ })
    .first()
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Find and replace" }).click();

  const dialog = page.getByRole("dialog", { name: "Find and Replace" });
  await dialog.getByRole("combobox", { name: "Find and replace field" }).selectOption("front");
  await dialog.getByRole("textbox", { name: "Find text" }).fill("alpha");
  await dialog.getByRole("textbox", { name: "Replacement text" }).fill("beta");
  await dialog.getByRole("checkbox", { name: "Selected notes only" }).check();
  await dialog.getByRole("button", { name: "Run find and replace" }).click();

  await expect(dialog).toContainText("Replaced 1 field value.");
  await expect(dialog).toContainText("Scope: selected notes");
  await expect(dialog).toContainText("Field: Front");

  await dialog.getByRole("checkbox", { name: "Selected notes only" }).uncheck();
  await dialog.getByRole("textbox", { name: "Find text" }).fill("alpha");
  await dialog.getByRole("textbox", { name: "Replacement text" }).fill("gamma");
  await dialog.getByRole("button", { name: "Run find and replace" }).click();

  await expect(dialog).toContainText("Scope: all notes");
});

test("ANKI-FIND-REPLACE-004 ANKI-FIND-REPLACE-005 ANKI-FIND-REPLACE-006: find and replace supports tags, regex, and ignore case", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      {
        back: "Answer",
        front: "Capital of France",
        id: "card-1",
        noteId: "note-1",
        noteTags: ["science"],
        repetitions: 1,
      },
    ],
  });
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Find and replace" }).click();

  const dialog = page.getByRole("dialog", { name: "Find and Replace" });
  await dialog.getByRole("combobox", { name: "Find and replace field" }).selectOption("tags");
  await dialog.getByRole("textbox", { name: "Find text" }).fill("science");
  await dialog.getByRole("textbox", { name: "Replacement text" }).fill("biology");
  await dialog.getByRole("button", { name: "Run find and replace" }).click();
  await expect(dialog).toContainText("Renamed tag science to biology.");

  await dialog.getByRole("combobox", { name: "Find and replace field" }).selectOption("front");
  await dialog.getByRole("checkbox", { name: "Use regex" }).check();
  await dialog.getByRole("textbox", { name: "Find text" }).fill("Capital (.*)");
  await dialog.getByRole("textbox", { name: "Replacement text" }).fill("City $1");
  await dialog.getByRole("button", { name: "Run find and replace" }).click();
  await expect(dialog).toContainText("Regex enabled");

  await dialog.getByRole("checkbox", { name: "Use regex" }).uncheck();
  await dialog.getByRole("checkbox", { name: "Ignore case" }).check();
  await dialog.getByRole("textbox", { name: "Find text" }).fill("capital");
  await dialog.getByRole("textbox", { name: "Replacement text" }).fill("Capital");
  await dialog.getByRole("button", { name: "Run find and replace" }).click();
  await expect(dialog).toContainText("Ignore case enabled");
});
