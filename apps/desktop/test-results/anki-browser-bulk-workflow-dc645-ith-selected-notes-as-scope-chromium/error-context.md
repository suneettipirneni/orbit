# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: anki-browser-bulk-workflows.spec.ts >> ANKI-BROWSER-026: Export Notes opens with selected notes as scope
- Location: e2e/anki-browser-bulk-workflows.spec.ts:91:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Scope: selected notes')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Scope: selected notes')

```

```yaml
- list:
    - listitem:
        - button "Orbit Decks and reviews"
- text: Decks
- list:
    - listitem: New Learn Review
    - listitem:
        - button "Collapse Default" [expanded]
        - button "Default"
        - button "Deck actions for Default"
        - text: 1 New 1 Learn 0 Review 1
    - listitem:
        - button "Biology"
        - button "Deck actions for Default::Biology"
        - text: 0 New 0 Learn 0 Review 0
    - listitem:
        - button "Move deck to top level": Top level
- button "Import Anki"
- group:
    - text: New deck
    - textbox "New deck":
        - /placeholder: Biology
    - button "Create deck"
- button "Toggle Sidebar"
- main:
    - main:
        - button "Toggle Sidebar"
        - navigation "breadcrumb":
            - list:
                - listitem:
                    - link "Decks":
                        - /url: /
                - listitem:
                    - link "Default" [disabled]
        - heading "Default" [level=1]
        - button "Edit deck description"
        - paragraph: Default deck
        - text: New 1 Learning 0 To Review 1
        - button "Study Now"
        - button "Options"
        - button "Custom Study"
        - button "Description"
        - text: Add note
        - form "Add note":
            - group:
                - text: Note type
                - combobox "Note type":
                    - option "Basic" [selected]
                    - option "Basic + Extra"
                    - option "Cloze"
                    - option "Image Occlusion"
            - group:
                - text: Deck
                - combobox "Deck":
                    - option "Default" [selected]
                    - option "Default::Biology"
            - button "Manage note types"
            - button "Bold"
            - button "Italic"
            - button "Underline"
            - button "Superscript"
            - button "Subscript"
            - button "Clear formatting"
            - button "Text color red"
            - button "Highlight yellow"
            - button "Cloze"
            - button "Attach media"
            - button "Record audio"
            - button "Paste unsafe HTML"
            - button "Paste remote image"
            - button "Paste image"
            - button "Check duplicate"
            - button "Image occlusion from file"
            - button "Image occlusion from clipboard"
            - button "Put image on clipboard"
            - group:
                - text: Front
                - button "Toggle sticky Front": Sticky
                - textbox "Front"
            - group:
                - text: Back
                - button "Toggle sticky Back": Sticky
                - textbox "Back"
            - group:
                - text: Tags
                - textbox "Add note tags"
            - paragraph: "Add-note tag list: none"
            - button "Add"
            - button "Add history"
        - textbox "Search cards":
            - /placeholder: Search cards with Anki syntax...
        - complementary "Browser sidebar panel":
            - text: Filter
            - textbox "Sidebar filter"
            - tree "Browser sidebar":
                - tree:
                    - treeitem "Default" [level=1] [selected]: Defa ult
                    - treeitem "Default::Biology" [level=1]: "Default: :Biology"
            - paragraph: "Tag list: science, unused"
        - region "Card list":
            - radiogroup "Browser display mode":
                - radio "Card rows" [checked]: Cards
                - radio "Note rows": Notes
            - radiogroup "Browser layout":
                - radio "Layout auto" [checked]
                - radio "Layout vertical"
                - radio "Layout horizontal"
            - button "Add note from browser"
            - button "Create copy from browser" [disabled]
            - button "Delete selected notes" [disabled]
            - button "Grade now" [disabled]
            - button "Clear unused tags"
            - button "Change note type" [disabled]
            - button "Find duplicates"
            - button "Find and replace" [disabled]
            - button "Export notes"
            - button "Create filtered deck"
            - button "Browser settings"
            - button "Undo browser change" [disabled]
            - button "Redo browser change" [disabled]
            - button "Full screen browser"
            - button "Close browser"
            - button "Zoom out"
            - button "Reset zoom" [disabled]
            - button "Zoom in"
            - button "Invert selection"
            - button "Select notes" [disabled]
            - button "Find/search focus"
            - button "Filter focus"
            - button "Sidebar focus"
            - button "Toggle sidebar"
            - button "Note focus" [disabled]
            - button "Card list focus"
            - button "Preview selected card" [disabled]
            - button "Card info" [disabled]
            - button "First card" [disabled]
            - button "Previous card" [disabled]
            - button "Next card" [disabled]
            - button "Last card" [disabled]
            - button "View"
            - table:
                - rowgroup:
                    - row "Select all rows Card Due Sort field Card type Interval":
                        - columnheader "Select all rows":
                            - checkbox "Select all rows"
                        - columnheader "Card"
                        - columnheader "Due"
                        - columnheader "Sort field"
                        - columnheader "Card type"
                        - columnheader "Interval"
                - rowgroup:
                    - row "Select row Capital of France Jun 19, 2026, 8:00 AM Capital of France Front 0 days":
                        - cell "Select row":
                            - checkbox "Select row"
                        - cell "Capital of France":
                            - paragraph: Capital of France
                        - cell "Jun 19, 2026, 8:00 AM"
                        - cell "Capital of France"
                        - cell "Front"
                        - cell "0 days"
                    - row "Select row Largest planet Jun 19, 2026, 8:00 AM Largest planet Front 5 days":
                        - cell "Select row":
                            - checkbox "Select row"
                        - cell "Largest planet":
                            - paragraph: Largest planet
                        - cell "Jun 19, 2026, 8:00 AM"
                        - cell "Largest planet"
                        - cell "Front"
                        - cell "5 days"
            - text: 0 of 2 row(s) selected.
            - paragraph: Rows per page
            - combobox: "10"
            - text: Page 1 of 1
            - button "Go to first page" [disabled]
            - button "Go to previous page" [disabled]
            - button "Go to next page" [disabled]
            - button "Go to last page" [disabled]
        - region "Selected note editor":
            - heading "Editor" [level=2]
            - paragraph: Select a row to edit its note.
        - dialog "Export Notes":
            - heading "Export Notes" [level=2]
            - button "Close export notes"
            - paragraph: "Scope: search results"
            - paragraph: note-1, note-2
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { mockOrbitApi } from "./fixtures/orbit-api";
  3   |
  4   | test("ANKI-BROWSER-012: Clear Unused Tags removes tags not assigned to notes", async ({
  5   |   page,
  6   | }) => {
  7   |   await mockOrbitApi(page);
  8   |   await page.goto("/decks/deck-1");
  9   |
  10  |   await expect(page.getByText("Tag list: science, unused")).toBeVisible();
  11  |
  12  |   await page.getByRole("button", { name: "Clear unused tags" }).click();
  13  |
  14  |   await expect(page.getByRole("dialog", { name: "Clear Unused Tags" })).toBeVisible();
  15  |   await expect(page.getByText("Removed: unused")).toBeVisible();
  16  |   await expect(page.getByText("Tag list: science")).toBeVisible();
  17  | });
  18  |
  19  | test("ANKI-BROWSER-023: Change Note Type maps selected notes to the target type", async ({
  20  |   page,
  21  | }) => {
  22  |   await mockOrbitApi(page);
  23  |   await page.goto("/decks/deck-1");
  24  |
  25  |   await page.getByRole("row", { name: /Capital of France/ }).getByRole("checkbox").click();
  26  |   await page.getByRole("button", { name: "Change note type" }).click();
  27  |   await expect(page.getByRole("dialog", { name: "Change Note Type" })).toBeVisible();
  28  |
  29  |   await page.getByRole("combobox", { name: "Target note type" }).selectOption("cloze");
  30  |   await page.getByRole("combobox", { name: "Front field mapping" }).selectOption("Text");
  31  |   await page.getByRole("button", { name: "Confirm note type change" }).click();
  32  |
  33  |   await expect(page.getByText("note-1 -> Cloze")).toBeVisible();
  34  |   await expect(page.getByText("Front -> Text")).toBeVisible();
  35  |   await expect(page.getByText("Note type: Cloze")).toBeVisible();
  36  | });
  37  |
  38  | test("ANKI-BROWSER-024: Find Duplicates reports duplicate note groups for a field", async ({
  39  |   page,
  40  | }) => {
  41  |   await mockOrbitApi(page, {
  42  |     browserCards: [
  43  |       { back: "Answer one", front: "Shared term", id: "card-1", noteId: "note-1" },
  44  |       { back: "Answer two", front: "Shared term", id: "card-2", noteId: "note-2" },
  45  |       { back: "Answer three", front: "Unique term", id: "card-3", noteId: "note-3" },
  46  |     ],
  47  |   });
  48  |   await page.goto("/decks/deck-1");
  49  |
  50  |   await page.getByRole("button", { name: "Find duplicates" }).click();
  51  |   await page.getByRole("combobox", { name: "Duplicate field" }).selectOption("front");
  52  |   await page.getByRole("button", { name: "Run duplicate search" }).click();
  53  |
  54  |   const duplicateDialog = page.getByRole("dialog", { name: "Find Duplicates" });
  55  |
  56  |   await expect(duplicateDialog).toBeVisible();
  57  |   await expect(duplicateDialog.getByText("Shared term: note-1, note-2")).toBeVisible();
  58  |   await expect(duplicateDialog.getByText("Unique term")).not.toBeVisible();
  59  | });
  60  |
  61  | test("ANKI-BROWSER-025: Find and Replace updates matching selected note fields", async ({
  62  |   page,
  63  | }) => {
  64  |   await mockOrbitApi(page);
  65  |   await page.goto("/decks/deck-1");
  66  |
  67  |   await page.getByRole("row", { name: /Capital of France/ }).getByRole("checkbox").click();
  68  |   await page.getByRole("button", { name: "Find and replace" }).click();
  69  |   await page.getByRole("textbox", { name: "Find text" }).fill("Capital");
  70  |   await page.getByRole("textbox", { name: "Replacement text" }).fill("Capital city");
  71  |   await page.getByRole("button", { name: "Run find and replace" }).click();
  72  |
  73  |   await expect(page.getByText("Replaced 1 field value.")).toBeVisible();
  74  |   await expect
  75  |     .poll(() =>
  76  |       page.evaluate(
  77  |         () =>
  78  |           (
  79  |             window as unknown as {
  80  |               __orbitNoteUpdates: Array<{ input: Record<string, unknown>; noteId: string }>;
  81  |             }
  82  |           ).__orbitNoteUpdates,
  83  |       ),
  84  |     )
  85  |     .toContainEqual({
  86  |       input: { back: "Paris", front: "Capital city of France" },
  87  |       noteId: "note-1",
  88  |     });
  89  | });
  90  |
  91  | test("ANKI-BROWSER-026: Export Notes opens with selected notes as scope", async ({ page }) => {
  92  |   await mockOrbitApi(page);
  93  |   await page.goto("/decks/deck-1");
  94  |
  95  |   await page.getByRole("row", { name: /Capital of France/ }).getByRole("checkbox").click();
  96  |   await page.getByRole("button", { name: "Export notes" }).click();
  97  |
  98  |   await expect(page.getByRole("dialog", { name: "Export Notes" })).toBeVisible();
> 99  |   await expect(page.getByText("Scope: selected notes")).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  100 |   await expect(page.getByText("note-1")).toBeVisible();
  101 | });
  102 |
  103 | test("ANKI-BROWSER-027: Create Filtered Deck uses current search and selection context", async ({
  104 |   page,
  105 | }) => {
  106 |   await mockOrbitApi(page);
  107 |   await page.goto("/decks/deck-1");
  108 |
  109 |   await page.getByPlaceholder("Search cards with Anki syntax...").fill("Capital");
  110 |   await page.keyboard.press("Enter");
  111 |   await page.getByRole("row", { name: /Capital of France/ }).getByRole("checkbox").click();
  112 |   await page.getByRole("button", { name: "Create filtered deck" }).click();
  113 |
  114 |   await expect(page.getByRole("dialog", { name: "Create Filtered Deck" })).toBeVisible();
  115 |   await expect(page.getByText("Search: Capital")).toBeVisible();
  116 |   await expect(page.getByText("Selected cards: card-1")).toBeVisible();
  117 | });
  118 |
```
