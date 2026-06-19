import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-LIB-018: deck library shows scheduler upgrade callout with update and more-info actions", async ({
  page,
}) => {
  await mockOrbitApi(page, { requiresSchedulerUpgrade: true });
  await page.goto("/");

  const callout = page.getByTestId("scheduler-upgrade-callout");

  await expect(callout).toContainText("Scheduler upgrade required");
  await expect(callout.getByRole("button", { name: "Update scheduler" })).toBeVisible();
  await expect(callout.getByRole("button", { name: "More info" })).toBeVisible();
});
