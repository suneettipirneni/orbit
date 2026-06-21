import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-015: Browser changes the deck for selected cards", async ({ page }) => {
  await mockOrbitApi(page, { includeDragTargetDeck: true });
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("combobox", { name: "Selected cards target deck" }).selectOption("deck-3");
  await page.getByRole("button", { name: "Change deck" }).click();

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
      { cardId: "card-1", input: { deckId: "deck-3" } },
      { cardId: "card-2", input: { deckId: "deck-3" } },
    ]);
});

test("ANKI-BROWSER-016: Browser sets the due date for selected cards", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("textbox", { name: "Selected card due date" }).fill("2026-07-01");
  await page.getByRole("button", { name: "Set due date" }).click();

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
      { cardId: "card-1", input: { dueAt: "2026-07-01T10:00:00.000Z" } },
      { cardId: "card-2", input: { dueAt: "2026-07-01T10:00:00.000Z" } },
    ]);
});

test("ANKI-BROWSER-017 ANKI-BROWSER-018: Browser forgets and repositions selected cards", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("button", { name: "Forget card" }).click();
  await page.getByRole("spinbutton", { name: "Selected card position" }).fill("42");
  await page.getByRole("button", { name: "Reposition card" }).click();

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
      { cardId: "card-1", input: { forget: true } },
      { cardId: "card-2", input: { forget: true } },
      { cardId: "card-1", input: { position: 42 } },
      { cardId: "card-2", input: { position: 42 } },
    ]);
});

test("ANKI-BROWSER-019 ANKI-BROWSER-020 ANKI-BROWSER-021: Browser suspends, unsuspends, and buries selected cards", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("button", { name: "Suspend card" }).click();
  await expect(page.getByText("State: Suspended")).toBeVisible();

  await page.getByRole("button", { name: "Unsuspend card" }).click();
  await expect(page.getByText("State: Review")).toBeVisible();

  await page.getByRole("button", { name: "Bury card" }).click();

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
      { cardId: "card-1", input: { suspended: true } },
      { cardId: "card-2", input: { suspended: true } },
      { cardId: "card-1", input: { suspended: false } },
      { cardId: "card-2", input: { suspended: false } },
      { cardId: "card-1", input: { buried: true } },
      { cardId: "card-2", input: { buried: true } },
    ]);
});

test("ANKI-BROWSER-022: Browser applies a flag color to selected cards", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await page.getByRole("button", { name: "Flag card" }).click();
  await page.getByRole("menuitem", { name: "Red" }).click();

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
    ]);
});
