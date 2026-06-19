import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-ADD-NOTES-001 ANKI-ADD-NOTES-002 ANKI-ADD-NOTES-010: Add dialog shows selectors and ordered fields", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await expect(addNoteForm.getByRole("combobox", { name: "Note type" })).toHaveValue("basic");
  await expect(addNoteForm.getByRole("combobox", { name: "Deck" })).toHaveValue("deck-1");
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toBeVisible();
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toBeVisible();
});

test("ANKI-ADD-NOTES-003 ANKI-ADD-NOTES-011 ANKI-ADD-NOTES-012 ANKI-ADD-NOTES-013: note type changes preserve fields and tags", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await addNoteForm.getByRole("textbox", { name: "Front" }).fill("Term");
  await addNoteForm.getByRole("textbox", { name: "Back" }).fill("Definition");
  await addNoteForm.getByRole("textbox", { name: "Add note tags" }).fill("biology");
  await addNoteForm.getByRole("textbox", { name: "Add note tags" }).blur();

  await addNoteForm.getByRole("combobox", { name: "Note type" }).selectOption("basic-extra");
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue("Term");
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toHaveValue("Definition");
  await expect(addNoteForm.getByRole("textbox", { name: "Extra" })).toHaveValue("");

  await addNoteForm.getByRole("combobox", { name: "Note type" }).selectOption("cloze");
  await expect(addNoteForm.getByRole("textbox", { name: "Text" })).toHaveValue("Term");
  await expect(addNoteForm.getByRole("textbox", { name: "Extra" })).toHaveValue("Definition");
  await expect(addNoteForm.getByText("Add-note tag list: biology")).toBeVisible();
});

test("ANKI-ADD-NOTES-004 ANKI-ADD-NOTES-005 ANKI-ADD-NOTES-007 ANKI-ADD-NOTES-008: add stores selected deck, generated cards, formatting, and media", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await addNoteForm.getByRole("combobox", { name: "Deck" }).selectOption("deck-2");
  await addNoteForm.getByRole("textbox", { name: "Front" }).fill("mitosis");
  await addNoteForm.getByRole("button", { name: "Bold" }).click();
  await addNoteForm.getByRole("button", { name: "Attach media" }).click();
  await addNoteForm.getByRole("textbox", { name: "Back" }).fill("cell division");
  await addNoteForm.getByRole("button", { exact: true, name: "Add" }).click();

  await expect(addNoteForm.getByText("Created 1 generated card.")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __orbitNoteCreates: Array<{ back: string; deckId: string; front: string }>;
            }
          ).__orbitNoteCreates,
      ),
    )
    .toContainEqual({
      back: "cell division",
      deckId: "deck-2",
      front: '<b>mitosis</b><img src="orbit-image.png">',
    });
});

test("ANKI-ADD-NOTES-006 ANKI-ADD-NOTES-009 ANKI-ADD-NOTES-014 ANKI-ADD-NOTES-015: unusable notes warn and sticky fields carry over", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await addNoteForm.getByRole("textbox", { name: "Front" }).fill("Only front");
  await addNoteForm.getByRole("button", { exact: true, name: "Add" }).click();
  await expect(addNoteForm.getByText("This note would generate no cards.")).toBeVisible();

  await addNoteForm.getByRole("button", { name: "Toggle sticky Front" }).click();
  await addNoteForm.getByRole("textbox", { name: "Back" }).fill("Answer");
  await addNoteForm.getByRole("button", { exact: true, name: "Add" }).click();

  await expect(addNoteForm.getByText("Created 1 generated card.")).toBeVisible();
  await expect(addNoteForm.getByRole("textbox", { name: "Front" })).toHaveValue("Only front");
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).toHaveValue("");
});

test("ANKI-ADD-NOTES-016 ANKI-ADD-NOTES-017 ANKI-ADD-NOTES-018: Add History opens editable, focused, and deleted entries", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await addNoteForm.getByRole("textbox", { name: "Front" }).fill("History front");
  await addNoteForm.getByRole("textbox", { name: "Back" }).fill("History back");
  await addNoteForm.getByRole("button", { exact: true, name: "Add" }).click();
  await addNoteForm.getByRole("button", { name: "Add history" }).click();

  await expect(page.getByRole("dialog", { name: "Add History" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open note-new in browser" })).toBeEnabled();
  await page.getByRole("button", { name: "Open note-new in browser" }).click();
  await expect(page.getByText("Browser focused on note-new")).toBeVisible();

  await addNoteForm.getByRole("button", { name: "Add history" }).click();
  await expect(page.getByRole("button", { name: "Deleted note deleted" })).toBeDisabled();
});

test("ANKI-EDITOR-001 ANKI-EDITOR-002 ANKI-EDITOR-003 ANKI-EDITOR-004 ANKI-EDITOR-005 ANKI-EDITOR-006 ANKI-EDITOR-007: formatting tools update stored field content", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  const front = addNoteForm.getByRole("textbox", { name: "Front" });

  await front.fill("format");
  await addNoteForm.getByRole("button", { name: "Bold" }).click();
  await expect(front).toHaveValue("<b>format</b>");
  await addNoteForm.getByRole("button", { name: "Clear formatting" }).click();
  await expect(front).toHaveValue("format");
  await addNoteForm.getByRole("button", { name: "Italic" }).click();
  await addNoteForm.getByRole("button", { name: "Underline" }).click();
  await addNoteForm.getByRole("button", { name: "Superscript" }).click();
  await addNoteForm.getByRole("button", { name: "Subscript" }).click();
  await addNoteForm.getByRole("button", { name: "Text color red" }).click();
  await addNoteForm.getByRole("button", { name: "Highlight yellow" }).click();

  await expect(front).toHaveValue(
    '<mark data-color="yellow"><span style="color:red"><sub><sup><u><i>format</i></u></sup></sub></span></mark>',
  );
});

test("ANKI-EDITOR-008 ANKI-EDITOR-009 ANKI-EDITOR-010 ANKI-EDITOR-011 ANKI-EDITOR-012 ANKI-EDITOR-013 ANKI-EDITOR-014 ANKI-EDITOR-015 ANKI-EDITOR-016: editor cloze, media, paste, duplicate, and tag tools work", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  const front = addNoteForm.getByRole("textbox", { name: "Front" });

  await front.fill("plain");
  await addNoteForm.getByRole("button", { name: "Cloze" }).click();
  await expect(addNoteForm.getByText("Cloze deletions require a cloze note type.")).toBeVisible();
  await addNoteForm.getByRole("combobox", { name: "Note type" }).selectOption("cloze");
  const text = addNoteForm.getByRole("textbox", { name: "Text" });
  await text.fill("answer");
  await addNoteForm.getByRole("button", { name: "Cloze" }).click();
  await expect(text).toHaveValue("{{c1::answer}}");

  await addNoteForm.getByRole("button", { name: "Record audio" }).click();
  await expect(text).toHaveValue("{{c1::answer}}[sound:recording.wav]");
  await addNoteForm.getByRole("button", { name: "Paste unsafe HTML" }).click();
  await expect(text).toHaveValue("safe");
  await addNoteForm.getByRole("button", { name: "Paste remote image" }).click();
  await expect(text).toHaveValue('safe<img src="remote-image.png">');
  await addNoteForm.getByRole("button", { name: "Paste image" }).click();
  await expect(text).toHaveValue('safe<img src="remote-image.png"><img src="pasted-image.png">');

  await addNoteForm.getByRole("combobox", { name: "Note type" }).selectOption("basic");
  await front.fill("Capital of France");
  await addNoteForm.getByRole("button", { name: "Check duplicate" }).click();
  await expect(addNoteForm.getByText("Duplicate first field")).toBeVisible();
  await addNoteForm.getByRole("textbox", { name: "Add note tags" }).fill("tagged");
  await addNoteForm.getByRole("textbox", { name: "Add note tags" }).blur();
  await expect(addNoteForm.getByText("Add-note tag list: tagged")).toBeVisible();
});

test("ANKI-EDITOR-017 ANKI-EDITOR-018 ANKI-EDITOR-019: image occlusion opens from file or clipboard and warns without an image", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const addNoteForm = page.getByRole("form", { name: "Add note" });

  await addNoteForm.getByRole("combobox", { name: "Note type" }).selectOption("image-occlusion");
  await addNoteForm.getByRole("button", { name: "Image occlusion from file" }).click();
  await expect(page.getByRole("dialog", { name: "Image Occlusion Editor" })).toContainText(
    "image-file.png",
  );
  await page.getByRole("button", { name: "Close image occlusion editor" }).click();

  await addNoteForm.getByRole("button", { name: "Image occlusion from clipboard" }).click();
  await expect(addNoteForm.getByText("No image found on clipboard.")).toBeVisible();
  await addNoteForm.getByRole("button", { name: "Put image on clipboard" }).click();
  await addNoteForm.getByRole("button", { name: "Image occlusion from clipboard" }).click();
  await expect(page.getByRole("dialog", { name: "Image Occlusion Editor" })).toContainText(
    "clipboard-image.png",
  );
});
