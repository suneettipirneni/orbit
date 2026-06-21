import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-NOTETYPE-001 ANKI-NOTETYPE-002 ANKI-NOTETYPE-003 ANKI-NOTETYPE-004 ANKI-NOTETYPE-005 ANKI-NOTETYPE-006: Manage Note Types lists and updates note types", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  await addNoteForm.getByRole("button", { name: "Manage note types" }).click();
  const noteTypes = page.getByRole("dialog", { name: "Manage Note Types" });

  await expect(noteTypes.getByRole("paragraph").filter({ hasText: /^Basic$/ })).toBeVisible();
  await expect(noteTypes.getByRole("paragraph").filter({ hasText: /^Cloze$/ })).toBeVisible();
  await expect(noteTypes.getByRole("button", { name: "Fields" })).toBeVisible();
  await expect(noteTypes.getByRole("button", { name: "Cards" })).toBeVisible();

  await noteTypes.getByRole("textbox", { name: "New note type name" }).fill("Vocabulary");
  await noteTypes.getByRole("button", { name: "Add note type" }).click();
  await expect(noteTypes.getByRole("paragraph").filter({ hasText: /^Vocabulary$/ })).toBeVisible();

  await noteTypes.getByRole("combobox", { name: "Managed note type" }).selectOption("basic");
  await noteTypes.getByRole("textbox", { name: "Rename note type" }).fill("Renamed Basic");
  await noteTypes.getByRole("button", { name: "Rename note type" }).click();
  await expect(
    noteTypes.getByRole("paragraph").filter({ hasText: /^Renamed Basic$/ }),
  ).toBeVisible();
  await expect(addNoteForm.getByLabel("Note type", { exact: true })).toContainText("Renamed Basic");

  await noteTypes.getByRole("button", { name: "Clone note type" }).click();
  await expect(
    noteTypes.getByRole("paragraph").filter({ hasText: /^Renamed Basic copy$/ }),
  ).toBeVisible();

  await noteTypes.getByRole("combobox", { name: "Managed note type" }).selectOption("vocabulary");
  await noteTypes.getByRole("button", { name: "Delete note type" }).click();
  await expect(
    noteTypes.getByRole("paragraph").filter({ hasText: /^Vocabulary$/ }),
  ).not.toBeVisible();
});

test("ANKI-NOTETYPE-007 ANKI-NOTETYPE-008 ANKI-NOTETYPE-009: Note Type Options save LaTeX rendering settings", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Manage note types" }).click();
  await page
    .getByRole("dialog", { name: "Manage Note Types" })
    .getByRole("button", { name: "Options" })
    .click();
  const options = page.getByRole("dialog", { name: "Note Type Options" });

  await expect(options.getByLabel("Scalable LaTeX images")).toBeVisible();
  await options.getByLabel("Scalable LaTeX images").check();
  await options.getByRole("textbox", { name: "LaTeX header" }).fill("\\header");
  await options.getByRole("textbox", { name: "LaTeX footer" }).fill("\\footer");
  await options.getByRole("button", { name: "Save note type options" }).click();

  await expect(page.getByText("LaTeX preview: scalable dvisvgm \\header \\footer")).toBeVisible();
});

test("ANKI-FIELDS-001 ANKI-FIELDS-002 ANKI-FIELDS-003 ANKI-FIELDS-004 ANKI-FIELDS-005 ANKI-FIELDS-006 ANKI-FIELDS-007 ANKI-FIELDS-008 ANKI-FIELDS-009 ANKI-FIELDS-010 ANKI-FIELDS-011 ANKI-FIELDS-012: Fields dialog edits field schema and behavior", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  const addNoteForm = page.getByRole("form", { name: "Add note" });
  await addNoteForm.getByRole("button", { name: "Manage note types" }).click();
  await page.getByRole("button", { name: "Fields" }).click();
  const fields = page.getByRole("dialog", { name: "Fields" });

  await expect(fields.getByText("1. Front")).toBeVisible();
  await expect(fields.getByText("2. Back")).toBeVisible();

  await fields.getByRole("textbox", { name: "New field name" }).fill("Hint");
  await fields.getByRole("button", { name: "Add field" }).click();
  await expect(fields.getByText("3. Hint")).toBeVisible();
  await expect(addNoteForm.getByRole("textbox", { name: "Hint" })).toBeVisible();

  await fields.getByRole("combobox", { name: "Selected field" }).selectOption("Hint");
  await fields.getByRole("textbox", { name: "Rename field" }).fill("Prompt");
  await fields.getByRole("button", { name: "Rename field" }).click();
  await expect(fields.getByText("3. Prompt")).toBeVisible();
  await expect(addNoteForm.getByRole("textbox", { name: "Prompt" })).toBeVisible();

  await fields.getByRole("button", { name: "Move field up" }).click();
  await expect(fields.getByText("2. Prompt")).toBeVisible();

  await fields.getByRole("textbox", { name: "Field description" }).fill("Shown while editing");
  await fields.getByRole("combobox", { name: "Field font" }).selectOption("Georgia");
  await fields.getByRole("spinbutton", { name: "Field font size" }).fill("18");
  await fields.getByLabel("Browser sort field").check();
  await fields.getByLabel("Right-to-left").check();
  await fields.getByLabel("Treat as HTML").check();
  await fields.getByLabel("Collapse by default").check();
  await fields.getByLabel("Exclude from search").check();
  await fields.getByRole("button", { name: "Save field settings" }).click();

  await expect(fields.getByText("Description: Shown while editing")).toBeVisible();
  await expect(fields.getByText("Font: Georgia 18")).toBeVisible();
  await expect(fields.getByText("Browser sort field: Prompt")).toBeVisible();
  await expect(fields.getByText("Direction: rtl")).toBeVisible();
  await expect(fields.getByText("Default content: HTML")).toBeVisible();
  await expect(fields.getByText("Collapsed by default")).toBeVisible();
  await expect(fields.getByText("Excluded from search")).toBeVisible();
  await expect(
    page.getByText("Browser field behavior: Prompt sorts rows; excluded fields ignored"),
  ).toBeVisible();

  await fields.getByRole("combobox", { name: "Selected field" }).selectOption("Back");
  await fields.getByRole("button", { name: "Delete field" }).click();
  await expect(fields.getByText("Back")).not.toBeVisible();
  await expect(addNoteForm.getByRole("textbox", { name: "Back" })).not.toBeVisible();
});

test("ANKI-TEMPLATE-001 ANKI-TEMPLATE-002 ANKI-TEMPLATE-003 ANKI-TEMPLATE-004 ANKI-TEMPLATE-005 ANKI-TEMPLATE-006 ANKI-TEMPLATE-007 ANKI-TEMPLATE-008 ANKI-TEMPLATE-009 ANKI-TEMPLATE-010: Template editor loads, edits, inserts fields, flips, and restores templates", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Manage note types" }).click();
  await page.getByRole("button", { name: "Cards" }).click();
  const templates = page.getByRole("dialog", { name: "Card Templates" });

  await expect(templates.getByRole("combobox", { name: "Card type" })).toHaveValue("card-1");
  await expect(templates.getByRole("textbox", { name: "Front template" })).toBeVisible();
  await expect(templates.getByRole("textbox", { name: "Back template" })).toBeVisible();
  await expect(templates.getByRole("textbox", { name: "Style template" })).toBeVisible();

  await templates.getByRole("button", { name: "Add field to front" }).click();
  await expect(templates.getByRole("textbox", { name: "Front template" })).toHaveValue(
    "{{Front}}{{Front}}",
  );
  await templates.getByRole("button", { name: "Add field to back" }).click();
  await expect(templates.getByRole("textbox", { name: "Back template" })).toHaveValue(
    "{{Front}}<hr id=answer>{{Back}}{{Back}}",
  );

  await templates.getByRole("textbox", { name: "Front template" }).fill("Question {{Front}}");
  await templates.getByRole("textbox", { name: "Back template" }).fill("Answer {{Back}}");
  await templates.getByRole("textbox", { name: "Style template" }).fill(".card { color: red; }");
  await expect(templates.getByText("Existing cards will be affected.")).toBeVisible();
  await templates.getByRole("button", { name: "Save template" }).click();
  await expect(templates.getByText("Preview question: Question Front")).toBeVisible();
  await expect(templates.getByText("Preview answer: Answer Back")).toBeVisible();
  await expect(templates.getByText("Preview style: .card { color: red; }")).toBeVisible();

  await templates.getByRole("combobox", { name: "Card type" }).selectOption("card-2");
  await expect(templates.getByRole("textbox", { name: "Front template" })).toHaveValue("{{Back}}");

  await templates.getByRole("button", { name: "Flip basic template" }).click();
  await expect(templates.getByRole("textbox", { name: "Front template" })).toHaveValue("{{Front}}");

  await templates.getByRole("button", { name: "Restore default template" }).click();
  await expect(templates.getByRole("textbox", { name: "Front template" })).toHaveValue("{{Front}}");
  await expect(templates.getByRole("textbox", { name: "Back template" })).toHaveValue(
    "{{Front}}<hr id=answer>{{Back}}",
  );
});

test("ANKI-TEMPLATE-011 ANKI-TEMPLATE-012 ANKI-TEMPLATE-013 ANKI-TEMPLATE-014 ANKI-TEMPLATE-015 ANKI-TEMPLATE-016 ANKI-TEMPLATE-017 ANKI-TEMPLATE-018 ANKI-TEMPLATE-PREVIEW-001 ANKI-TEMPLATE-PREVIEW-002 ANKI-TEMPLATE-PREVIEW-003: Template utilities manage card types, overrides, clipboard, browser appearance, and preview state", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:5173",
  });
  await page.goto("/browse");

  await page.getByRole("button", { name: "Manage note types" }).click();
  await page.getByRole("button", { name: "Cards" }).click();
  const templates = page.getByRole("dialog", { name: "Card Templates" });

  await templates.getByRole("button", { name: "Add card type" }).click();
  await expect(templates.getByRole("combobox", { name: "Card type" })).toContainText("Card 3");
  await templates.getByRole("textbox", { name: "Rename card type" }).fill("Recognition");
  await templates.getByRole("button", { name: "Rename card type" }).click();
  await expect(templates.getByRole("combobox", { name: "Card type" })).toContainText("Recognition");

  await templates.getByRole("button", { name: "Move card type up" }).click();
  await expect(templates.getByText("Template order: Recognition, Card 1, Card 2")).toBeVisible();

  await templates.getByRole("combobox", { name: "Deck override" }).selectOption("deck-2");
  await expect(templates.getByText("Deck override: deck-2")).toBeVisible();
  await templates.getByRole("button", { name: "Clear deck override" }).click();
  await expect(templates.getByText("Deck override: normal deck assignment")).toBeVisible();

  await templates.getByRole("textbox", { name: "Browser question format" }).fill("Q: {{Front}}");
  await templates.getByRole("textbox", { name: "Browser answer format" }).fill("A: {{Back}}");
  await templates.getByRole("combobox", { name: "Browser font" }).selectOption("serif");
  await templates.getByRole("spinbutton", { name: "Browser font size" }).fill("16");
  await templates.getByRole("button", { name: "Save browser appearance" }).click();
  await expect(
    templates.getByText("Browser appearance: Q: {{Front}} / A: {{Back}} / serif 16"),
  ).toBeVisible();

  await templates.getByLabel("Fill empty fields").check();
  await templates.getByLabel("Night mode preview").check();
  await templates.getByLabel("Mobile class preview").check();
  await expect(templates.getByText("Preview classes: fill-empty night mobile")).toBeVisible();

  await templates.getByRole("button", { name: "Copy template info" }).click();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("## Recognition");
  expect(clipboardText).toContain("Front:");
  expect(clipboardText).toContain("Back:");
  expect(clipboardText).toContain("Style:");

  await templates.getByRole("button", { name: "Remove card type" }).click();
  await expect(templates.getByRole("combobox", { name: "Card type" })).not.toContainText(
    "Recognition",
  );
});
