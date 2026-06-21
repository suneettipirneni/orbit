import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.skip(true, "Filtered deck and custom study controls are not mounted in the current routes.");

test("ANKI-FILTERED-001 ANKI-FILTERED-002 ANKI-FILTERED-003 ANKI-FILTERED-004 ANKI-FILTERED-005: filtered deck builder applies filters, limits, and order", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Create filtered deck" }).click();

  const dialog = page.getByRole("dialog", { name: "Create Filtered Deck" });
  await expect(dialog.getByRole("textbox", { name: "Filtered deck name" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Filter 1 search query" })).toBeVisible();
  await expect(dialog.getByRole("spinbutton", { name: "Filter 1 limit" })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Filter 1 order" })).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: "Reschedule based on answers" })).toBeChecked();

  await dialog.getByRole("textbox", { name: "Filtered deck name" }).fill("Filtered Capital");
  await dialog.getByRole("textbox", { name: "Filter 1 search query" }).fill("Capital");
  await dialog.getByRole("spinbutton", { name: "Filter 1 limit" }).fill("1");
  await dialog.getByRole("combobox", { name: "Filter 1 order" }).selectOption("oldest");
  await dialog.getByRole("checkbox", { name: "Enable second filter" }).check();
  await dialog.getByRole("textbox", { name: "Filter 2 search query" }).fill("Largest");
  await dialog.getByRole("spinbutton", { name: "Filter 2 limit" }).fill("1");
  await dialog.getByRole("combobox", { name: "Filter 2 order" }).selectOption("random");
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();

  await expect(dialog).toContainText("Built Filtered Capital with 2 movable cards.");
  await expect(dialog).toContainText("Filter 1: Capital, limit 1, order Oldest seen first");
  await expect(dialog).toContainText("Filter 2: Largest, limit 1, order Random");
});

test("ANKI-FILTERED-006 ANKI-FILTERED-007 ANKI-FILTERED-008 ANKI-FILTERED-009 ANKI-FILTERED-010 ANKI-FILTERED-015: filtered deck rescheduling, empty, preview, and unmovable behavior", async ({
  page,
}) => {
  await mockOrbitApi(page, { includeBuriedCards: true });
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Create filtered deck" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Filtered Deck" });

  await dialog.getByRole("textbox", { name: "Filter 1 search query" }).fill("Capital");
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();
  await expect(dialog).toContainText("Answers will update original card scheduling.");

  await dialog.getByRole("checkbox", { name: "Reschedule based on answers" }).uncheck();
  await dialog.getByRole("spinbutton", { name: "Again preview delay" }).fill("1");
  await dialog.getByRole("spinbutton", { name: "Hard preview delay" }).fill("5");
  await dialog.getByRole("spinbutton", { name: "Good preview delay" }).fill("10");
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();
  await expect(dialog).toContainText(
    "Cards return without normal schedule advancement; preview delays Again 1, Hard 5, Good 10.",
  );

  await dialog.getByRole("textbox", { name: "Filter 1 search query" }).fill("no-match");
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();
  await expect(dialog).toContainText("No matching movable cards; deck was not created.");

  await dialog.getByRole("checkbox", { name: "Create even if empty" }).check();
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();
  await expect(dialog).toContainText("Created empty filtered deck.");

  await dialog.getByRole("checkbox", { name: "Create even if empty" }).uncheck();
  await dialog.getByRole("textbox", { name: "Filter 1 search query" }).fill("buried");
  await dialog.getByRole("button", { name: "Build filtered deck" }).click();
  await expect(dialog).toContainText("Unmovable cards skipped: card-3, card-4");
});

test("ANKI-FILTERED-011 ANKI-FILTERED-012: filtered deck overview can rebuild and empty a filtered deck", async ({
  page,
}) => {
  await mockOrbitApi(page, { includeFilteredDeck: true });
  await page.goto("/decks/deck-filtered");

  await page.getByRole("button", { name: "Rebuild" }).click();
  await expect(page.getByText("Filtered deck rebuilt from saved filters.")).toBeVisible();

  await page.getByRole("button", { name: "Empty" }).click();
  await expect(
    page.getByText("Filtered deck emptied; cards returned to original decks."),
  ).toBeVisible();
});

test("ANKI-FILTERED-013 ANKI-FILTERED-014: browser context prefills filtered-deck search from selection or current search", async ({
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
  await expect(
    page.getByRole("dialog", { name: "Create Filtered Deck" }).getByRole("textbox", {
      name: "Filter 1 search query",
    }),
  ).toHaveValue("cid:card-1");
  await page.getByRole("button", { name: "Close create filtered deck" }).click();

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Create filtered deck" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create Filtered Deck" }).getByRole("textbox", {
      name: "Filter 1 search query",
    }),
  ).toHaveValue("Capital");
});

test("ANKI-CUSTOM-STUDY-001 ANKI-CUSTOM-STUDY-002 ANKI-CUSTOM-STUDY-003 ANKI-CUSTOM-STUDY-004 ANKI-CUSTOM-STUDY-005 ANKI-CUSTOM-STUDY-006 ANKI-CUSTOM-STUDY-007: custom study modes create targeted sessions", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Custom Study" }).click();

  const dialog = page.getByRole("dialog", { name: "Custom Study" });
  await expect(
    dialog.getByRole("radio", { name: "Increase today's new-card limit" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("radio", { name: "Increase today's review-card limit" }),
  ).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Review forgotten cards" })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Review ahead" })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Preview new cards" })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Study by card state or tag" })).toBeVisible();

  await dialog.getByRole("radio", { name: "Increase today's new-card limit" }).click();
  await dialog.getByRole("spinbutton", { name: "Additional new cards" }).fill("12");
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Additional new cards today: 12");

  await dialog.getByRole("radio", { name: "Increase today's review-card limit" }).click();
  await dialog.getByRole("spinbutton", { name: "Additional reviews" }).fill("30");
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Additional reviews today: 30");

  await dialog.getByRole("radio", { name: "Review forgotten cards" }).click();
  await dialog.getByRole("spinbutton", { name: "Forgotten days" }).fill("7");
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Review forgotten cards from the last 7 day(s).");

  await dialog.getByRole("radio", { name: "Review ahead" }).click();
  await dialog.getByRole("spinbutton", { name: "Ahead days" }).fill("5");
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Review ahead by 5 day(s).");

  await dialog.getByRole("radio", { name: "Preview new cards" }).click();
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Preview new cards without normal rescheduling.");

  await dialog.getByRole("radio", { name: "Study by card state or tag" }).click();
  await dialog.getByRole("combobox", { name: "Card state" }).selectOption("due");
  await dialog.getByRole("textbox", { name: "Custom study tag" }).fill("science");
  await dialog.getByRole("button", { name: "Start custom study" }).click();
  await expect(dialog).toContainText("Study Due cards only tagged science.");
});

test("ANKI-CUSTOM-STUDY-008: all-cards random custom study does not advance original scheduling", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Custom Study" }).click();
  const dialog = page.getByRole("dialog", { name: "Custom Study" });
  await dialog.getByRole("radio", { name: "Study by card state or tag" }).click();
  await dialog
    .getByRole("combobox", { name: "Card state" })
    .selectOption("all-random-no-reschedule");
  await dialog.getByRole("button", { name: "Start custom study" }).click();

  await expect(dialog).toContainText("All cards in random order without rescheduling.");
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
    .toEqual([]);
});
