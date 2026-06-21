import { expect, type Page, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

async function openPreferences(page: Page) {
  await page.getByRole("button", { name: "Preferences" }).click();
  return page.getByRole("dialog", { name: "Preferences" });
}

test("ANKI-PREFS-001 ANKI-PREFS-SCOPE-001 ANKI-PREFS-SCOPE-002: Preferences opens scoped sections and excludes sync/account behavior", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/");

  const preferences = await openPreferences(page);

  for (const section of ["Appearance", "Review", "Editing", "Backups", "Network"]) {
    await expect(preferences.getByRole("button", { name: section })).toBeVisible();
  }
  await expect(preferences.getByText("Sync and account controls are excluded.")).toBeVisible();
  await expect(preferences.getByText("Third-party account behavior is excluded.")).toBeVisible();
});

test.skip("ANKI-PREFS-APPEARANCE-001 ANKI-PREFS-APPEARANCE-002 ANKI-PREFS-APPEARANCE-003 ANKI-PREFS-APPEARANCE-004 ANKI-PREFS-APPEARANCE-005 ANKI-PREFS-APPEARANCE-006 ANKI-PREFS-APPEARANCE-007 ANKI-PREFS-APPEARANCE-008 ANKI-PREFS-APPEARANCE-009 ANKI-PREFS-APPEARANCE-010 ANKI-PREFS-APPEARANCE-011: appearance preferences persist and affect review chrome", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1" }],
  });
  await page.goto("/decks/deck-1/review");

  let preferences = await openPreferences(page);
  await preferences.getByRole("combobox", { name: "Language" }).selectOption("es");
  await preferences.getByRole("combobox", { name: "Video driver" }).selectOption("metal");
  await preferences.getByRole("checkbox", { name: "Check for updates" }).uncheck();
  await preferences.getByRole("combobox", { name: "Theme" }).selectOption("dark");
  await preferences.getByRole("combobox", { name: "Style" }).selectOption("fusion");
  await preferences.getByRole("spinbutton", { name: "User interface size" }).fill("125");
  await preferences.getByRole("button", { name: "Reset window sizes" }).click();
  await preferences.getByRole("checkbox", { name: "Hide top bar during review" }).check();
  await preferences.getByRole("checkbox", { name: "Hide bottom bar during review" }).check();
  await preferences.getByRole("checkbox", { name: "Reduce motion" }).check();
  await preferences.getByRole("checkbox", { name: "Minimalist mode" }).check();
  await preferences.getByRole("button", { name: "Save preferences" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-orbit-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-orbit-style", "fusion");
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");

  preferences = await openPreferences(page);
  await expect(preferences.getByRole("combobox", { name: "Language" })).toHaveValue("es");
  await expect(preferences.getByRole("combobox", { name: "Video driver" })).toHaveValue("metal");
  await expect(preferences.getByRole("checkbox", { name: "Check for updates" })).not.toBeChecked();
  await expect(preferences.getByText("Window sizes reset to defaults.")).toBeVisible();
  await preferences.getByRole("button", { name: "Close preferences" }).click();
  const reviewPanel = page.getByTestId("review-panel");
  await expect(reviewPanel).toHaveAttribute("data-reduce-motion", "true");
  await expect(reviewPanel).toHaveAttribute("data-minimalist", "true");
  await expect(page.getByTestId("review-top-bar")).toBeHidden();
  await expect(page.getByTestId("review-bottom-bar")).toBeHidden();
});

test.skip("ANKI-PREFS-REVIEW-001 ANKI-PREFS-REVIEW-002 ANKI-PREFS-REVIEW-003 ANKI-PREFS-REVIEW-004 ANKI-PREFS-REVIEW-005 ANKI-PREFS-REVIEW-006 ANKI-PREFS-REVIEW-007 ANKI-PREFS-REVIEW-008 ANKI-PREFS-REVIEW-010 ANKI-PREFS-REVIEW-011: review preferences control scheduler hints, audio, counts, timings, and keys", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      { back: "Paris", front: "Capital [sound:q.mp3] \\(x^2\\)", id: "card-1" },
      { back: "Jupiter", front: "Largest planet", id: "card-2", repetitions: 3 },
    ],
  });
  await page.goto("/decks/deck-1/review");

  const preferences = await openPreferences(page);
  await preferences.getByRole("button", { name: "Review" }).click();
  await preferences.getByRole("spinbutton", { name: "Next day starts at" }).fill("5");
  await preferences.getByRole("spinbutton", { name: "Learn-ahead limit" }).fill("20");
  await preferences.getByRole("spinbutton", { name: "Timebox time limit" }).fill("3");
  await preferences
    .getByRole("checkbox", { name: "Show play buttons on cards with audio" })
    .check();
  await preferences
    .getByRole("checkbox", { name: "Interrupt current audio when answering" })
    .check();
  await preferences.getByRole("checkbox", { name: "Show remaining card count" }).check();
  await preferences.getByRole("checkbox", { name: "Show next review time" }).check();
  await preferences.getByRole("checkbox", { name: "Spacebar rates card" }).check();
  await preferences.getByRole("checkbox", { name: "Generate LaTeX images automatically" }).check();
  await preferences.getByRole("textbox", { name: "Answer keys" }).fill("3=Good");
  await preferences.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Scheduler day starts at 5:00")).toBeVisible();
  await expect(page.getByText("Learn ahead 20m")).toBeVisible();
  await expect(page.getByText("Timebox 3m")).toBeVisible();
  await expect(page.getByLabel("Remaining card count")).toContainText("2 due");
  await expect(page.getByRole("button", { name: "Play card audio" })).toBeVisible();
  await expect(page.getByText("LaTeX images generated")).toBeVisible();

  await page.getByRole("button", { name: "Play card audio" }).click();
  await page.getByRole("button", { name: "Show Answer" }).click();
  await expect(page.getByText("Audio interrupted")).toBeVisible();
  await expect(page.getByText("Next review:")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText("Largest planet").first()).toBeVisible();

  await page.getByRole("button", { name: "Show Answer" }).click();
  await page.keyboard.press("3");
  await expect(page.getByRole("heading", { name: "Congratulations" })).toBeVisible();
});

test.skip("ANKI-PREFS-REVIEW-009: disabling spacebar rating prevents accidental answer submission", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [{ back: "Paris", front: "Capital of France", id: "card-1" }],
  });
  await page.goto("/decks/deck-1/review");

  const preferences = await openPreferences(page);
  await preferences.getByRole("button", { name: "Review" }).click();
  await preferences.getByRole("checkbox", { name: "Spacebar rates card" }).uncheck();
  await preferences.getByRole("button", { name: "Save preferences" }).click();
  await page.getByRole("button", { name: "Show Answer" }).click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Good" })).toBeVisible();
});

test.skip("ANKI-PREFS-EDITING-001 ANKI-PREFS-EDITING-002 ANKI-PREFS-EDITING-003 ANKI-PREFS-EDITING-004 ANKI-PREFS-EDITING-005 ANKI-PREFS-EDITING-006: editing and browsing preferences affect add and browser defaults", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "Cafe answer", front: "Café", id: "card-1", noteId: "note-1" },
      { back: "Tea answer", front: "Tea", id: "card-2", noteId: "note-2" },
    ],
  });
  await page.goto("/browse");

  const preferences = await openPreferences(page);
  await preferences.getByRole("button", { name: "Editing" }).click();
  await preferences.getByRole("checkbox", { name: "Paste clipboard images as PNG" }).check();
  await preferences
    .getByRole("checkbox", { name: "Paste without shift strips formatting" })
    .check();
  await preferences
    .getByRole("combobox", { name: "Default deck behavior when adding" })
    .selectOption("note-type");
  await preferences.getByRole("textbox", { name: "Default search text" }).fill("cafe");
  await preferences.getByRole("checkbox", { name: "Ignore accents in search" }).check();
  await preferences.getByRole("button", { name: "Save preferences" }).click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        (window.localStorage.getItem("orbit:anki-preferences") ?? "").includes(
          '"defaultSearchText":"cafe"',
        ),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Search cards" })).toHaveValue("cafe");
  await expect(page.getByText("Café")).toBeVisible();

  const addNote = page.getByRole("form", { name: "Add note" });
  await addNote.getByRole("combobox", { name: "Note type" }).selectOption("cloze");
  await expect(addNote.getByRole("combobox", { name: "Deck" })).toHaveValue("deck-2");
  await addNote.getByRole("textbox", { name: "Text" }).fill("formatted");
  await addNote.getByRole("button", { name: "Paste unsafe HTML" }).click();
  await expect(addNote.getByRole("textbox", { name: "Text" })).toHaveValue("safe");
  await addNote.getByRole("button", { name: "Paste image" }).click();
  await expect(addNote.getByRole("textbox", { name: "Text" })).toHaveValue(
    'safe<img src="pasted-image.png">',
  );
});

test("ANKI-PREFS-BACKUPS-001: backup retention preferences persist when reopened", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/");

  let preferences = await openPreferences(page);
  await preferences.getByRole("button", { name: "Backups" }).click();
  await preferences.getByRole("spinbutton", { name: "Minutes between backups" }).fill("15");
  await preferences.getByRole("spinbutton", { name: "Daily backups" }).fill("9");
  await preferences.getByRole("spinbutton", { name: "Weekly backups" }).fill("6");
  await preferences.getByRole("spinbutton", { name: "Monthly backups" }).fill("18");
  await preferences.getByRole("button", { name: "Save preferences" }).click();

  preferences = await openPreferences(page);
  await preferences.getByRole("button", { name: "Backups" }).click();
  await expect(
    preferences.getByRole("spinbutton", { name: "Minutes between backups" }),
  ).toHaveValue("15");
  await expect(preferences.getByRole("spinbutton", { name: "Daily backups" })).toHaveValue("9");
  await expect(preferences.getByRole("spinbutton", { name: "Weekly backups" })).toHaveValue("6");
  await expect(preferences.getByRole("spinbutton", { name: "Monthly backups" })).toHaveValue("18");
  await expect(preferences.getByText("Restore from the backup folder when needed.")).toBeVisible();
});
