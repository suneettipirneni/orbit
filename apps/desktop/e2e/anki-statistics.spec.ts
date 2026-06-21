import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-STATS-001 ANKI-STATS-002 ANKI-STATS-003: Statistics opens and switches deck or collection scope", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Stats" }).click();

  const dialog = page.getByRole("dialog", { name: "Statistics" });
  const report = dialog.getByRole("region", { name: "Statistics report web view" });

  await expect(report).toContainText("Statistics report");
  await expect(report).toContainText("Scope: Collection");
  await expect(report).toContainText("Deck: All decks");

  await dialog.getByRole("radio", { exact: true, name: "Deck" }).click();
  await expect(report).toContainText("Scope: Deck");
  await expect(report).toContainText("Deck: Default");

  await dialog.getByRole("radio", { name: "Collection" }).click();
  await expect(report).toContainText("Scope: Collection");
  await expect(report).toContainText("Deck: All decks");

  await dialog.getByRole("radio", { exact: true, name: "Deck" }).click();
  await expect(report).toContainText("Scope: Deck");
  await expect(report).toContainText("Deck: Default");
});

test("ANKI-STATS-004 ANKI-STATS-005 ANKI-STATS-006 ANKI-STATS-007: Statistics regenerates for time range and selected deck", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Stats" }).click();

  const dialog = page.getByRole("dialog", { name: "Statistics" });
  const report = dialog.getByRole("region", { name: "Statistics report web view" });

  await dialog.getByRole("radio", { name: "1 month" }).click();
  await expect(report).toContainText("Window: 1 month");

  await dialog.getByRole("radio", { name: "1 year" }).click();
  await expect(report).toContainText("Window: 1 year");

  await dialog.getByRole("radio", { name: "Deck life" }).click();
  await expect(report).toContainText("Window: deck life");

  await dialog.getByRole("radio", { exact: true, name: "Deck" }).click();
  await dialog.getByRole("combobox", { name: "Statistics deck" }).selectOption("deck-2");
  await expect(report).toContainText("Deck: Default::Biology");
});

test("ANKI-STATS-008: Statistics closes without changing review data", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(page.getByRole("dialog", { name: "Statistics" })).toBeVisible();
  await page.getByRole("button", { name: "Close statistics" }).click();

  await expect(page.getByRole("dialog", { name: "Statistics" })).toBeHidden();
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
