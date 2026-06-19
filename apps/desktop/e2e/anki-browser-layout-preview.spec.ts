import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-028 ANKI-BROWSER-029 ANKI-BROWSER-046 ANKI-BROWSER-047: Browser layout can be vertical, horizontal, or automatic by viewport shape", async ({
  page,
}) => {
  await page.setViewportSize({ height: 700, width: 1100 });
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  const browserWorkArea = page.getByTestId("browser-work-area");
  await expect(browserWorkArea).toHaveAttribute("data-browser-layout", "horizontal");

  await page.getByRole("radio", { name: "Layout vertical" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-layout", "vertical");

  await page.getByRole("radio", { name: "Layout horizontal" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-layout", "horizontal");

  await page.getByRole("radio", { name: "Layout auto" }).click();
  await page.setViewportSize({ height: 1100, width: 700 });
  await expect(browserWorkArea).toHaveAttribute("data-browser-layout", "vertical");
});

test("ANKI-BROWSER-030 ANKI-BROWSER-031 ANKI-BROWSER-032: Browser sidebar can hide, show, and filter deck nodes", async ({
  page,
}) => {
  await mockOrbitApi(page, { includeDragTargetDeck: true });
  await page.goto("/decks/deck-1");
  const browserWorkArea = page.getByTestId("browser-work-area");

  await expect(page.getByRole("complementary", { name: "Browser sidebar panel" })).toBeVisible();
  await browserWorkArea.getByRole("button", { name: "Toggle sidebar" }).click();
  await expect(page.getByRole("complementary", { name: "Browser sidebar panel" })).toBeHidden();

  await browserWorkArea.getByRole("button", { name: "Toggle sidebar" }).click();
  await expect(page.getByRole("textbox", { name: "Sidebar filter" })).toBeVisible();

  await page.getByRole("textbox", { name: "Sidebar filter" }).fill("Chem");
  await expect(page.getByRole("complementary", { name: "Browser sidebar panel" })).toHaveAttribute(
    "data-visible-decks",
    "Chemistry",
  );
});

test("ANKI-BROWSER-033 ANKI-BROWSER-034: Browser preview opens for the selected card and follows selection changes", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  });

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Preview selected card" }).click();
  await expect(page.getByRole("dialog", { name: "Card Preview" })).toContainText(
    "Capital of France",
  );

  await page
    .getByRole("row", { name: /Largest planet/ })
    .getByRole("checkbox")
    .click();
  await expect(page.getByRole("dialog", { name: "Card Preview" })).toContainText("Largest planet");
});

test("ANKI-BROWSER-035 ANKI-BROWSER-036: Browser Card Info shows metadata and copies structured card info", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Card info" }).click();

  await expect(page.getByRole("dialog", { name: "Card Info" })).toContainText("card-1");
  await expect(page.getByRole("dialog", { name: "Card Info" })).toContainText("Review log");

  await page.getByRole("button", { name: "Copy card info" }).click();
  const clipboardText = await page.evaluate(
    () =>
      (
        window as unknown as {
          __orbitClipboardText?: string;
        }
      ).__orbitClipboardText ?? "",
  );

  expect(JSON.parse(clipboardText)).toMatchObject({
    cardId: "card-1",
    front: "Capital of France",
    noteId: "note-1",
  });
});
