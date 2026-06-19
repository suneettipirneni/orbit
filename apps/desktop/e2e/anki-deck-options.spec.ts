import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-DECK-OPTIONS-001 ANKI-DECK-OPTIONS-002 ANKI-DECK-OPTIONS-003: option groups switch settings and save shared group changes", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Deck Options" });

  await expect(options.getByRole("combobox", { name: "Options group" })).toBeVisible();
  await options.getByRole("combobox", { name: "Options group" }).selectOption("high-volume");
  await expect(
    options.getByRole("spinbutton", { exact: true, name: "New cards per day" }),
  ).toHaveValue("50");

  await options.getByRole("textbox", { exact: true, name: "Learning steps" }).fill("2 15");
  await options.getByRole("button", { name: "Save deck options" }).click();

  await expect(options.getByText("Saved group High Volume: learning steps 2 15")).toBeVisible();
  await expect(
    options.getByText("Default::Biology uses High Volume with learning steps 2 15"),
  ).toBeVisible();
});

test("ANKI-DECK-OPTIONS-004 ANKI-DECK-OPTIONS-005 ANKI-DECK-OPTIONS-006 ANKI-DECK-OPTIONS-007 ANKI-DECK-OPTIONS-008 ANKI-DECK-OPTIONS-009 ANKI-DECK-OPTIONS-010 ANKI-DECK-OPTIONS-011 ANKI-DECK-OPTIONS-012 ANKI-DECK-OPTIONS-013 ANKI-DECK-OPTIONS-014 ANKI-DECK-OPTIONS-015 ANKI-DECK-OPTIONS-016 ANKI-DECK-OPTIONS-025 ANKI-DECK-OPTIONS-026 ANKI-DECK-OPTIONS-027 ANKI-DECK-OPTIONS-028 ANKI-DECK-OPTIONS-029 ANKI-DECK-OPTIONS-030 ANKI-DECK-OPTIONS-031 ANKI-DECK-OPTIONS-032 ANKI-DECK-OPTIONS-033 ANKI-DECK-OPTIONS-034 ANKI-DECK-OPTIONS-035 ANKI-DECK-OPTIONS-036 ANKI-DECK-OPTIONS-037 ANKI-DECK-OPTIONS-038: new/review scheduling, ordering, burying, and daily limits are saved", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Deck Options" });

  await options.getByRole("textbox", { exact: true, name: "Learning steps" }).fill("1 10");
  await options.getByRole("spinbutton", { exact: true, name: "New cards per day" }).fill("7");
  await options.getByRole("spinbutton", { name: "Minimum new cards per day" }).fill("2");
  await options
    .getByRole("combobox", { name: "New card gather priority" })
    .selectOption("deck-order");
  await options
    .getByRole("combobox", { name: "New card sort order" })
    .selectOption("template-order");
  await options.getByRole("combobox", { name: "New card insertion order" }).selectOption("random");
  await options.getByRole("combobox", { name: "New review mix" }).selectOption("before-reviews");
  await options.getByRole("combobox", { name: "New card order" }).selectOption("random-card");
  await options.getByRole("spinbutton", { name: "Graduating interval" }).fill("3");
  await options.getByRole("spinbutton", { name: "Easy interval" }).fill("5");
  await options.getByRole("spinbutton", { name: "Starting ease" }).fill("230");
  await options.getByLabel("Bury related new cards").check();
  await options.getByRole("spinbutton", { name: "Maximum reviews per day" }).fill("9");
  await options
    .getByRole("combobox", { name: "Review order" })
    .selectOption("retrievability-ascending");
  await options
    .getByRole("combobox", { name: "Interday learning mix" })
    .selectOption("before-reviews");
  await options.getByRole("spinbutton", { name: "Easy bonus" }).fill("1.4");
  await options.getByRole("spinbutton", { name: "Hard interval behavior" }).fill("1.2");
  await options.getByRole("spinbutton", { name: "Interval modifier" }).fill("0.8");
  await options.getByRole("spinbutton", { name: "Maximum interval" }).fill("90");
  await options.getByLabel("Bury related reviews").check();
  await options.getByLabel("Bury interday learning siblings").check();
  await options.getByRole("spinbutton", { name: "Current deck new override" }).fill("4");
  await options.getByRole("spinbutton", { name: "Current deck review override" }).fill("6");
  await options.getByLabel("Parent limits apply").check();
  await options.getByRole("button", { name: "Save deck options" }).click();

  await expect(options.getByText("Learning steps: 1 10")).toBeVisible();
  await expect(
    options.getByText("New introduction: 7/day min 2, random-card, random"),
  ).toBeVisible();
  await expect(options.getByText("Graduation: good 3d, easy 5d, ease 230%")).toBeVisible();
  await expect(options.getByText("Burying: new reviews interday")).toBeVisible();
  await expect(
    options.getByText("Review limits/order: 9/day, retrievability-ascending"),
  ).toBeVisible();
  await expect(
    options.getByText("Review intervals: easy 1.4, hard 1.2, modifier 0.8, max 90d"),
  ).toBeVisible();
  await expect(
    options.getByText(
      "Queue order: gather deck-order, sort template-order, mix before-reviews, interday before-reviews",
    ),
  ).toBeVisible();
  await expect(
    options.getByText("Current deck limits: new 4, review 6, parent limits apply"),
  ).toBeVisible();
});

test("ANKI-DECK-OPTIONS-017 ANKI-DECK-OPTIONS-018 ANKI-DECK-OPTIONS-019 ANKI-DECK-OPTIONS-020 ANKI-DECK-OPTIONS-021 ANKI-DECK-OPTIONS-022 ANKI-DECK-OPTIONS-023 ANKI-DECK-OPTIONS-024 ANKI-DECK-OPTIONS-045 ANKI-DECK-OPTIONS-046 ANKI-DECK-OPTIONS-047: lapse, leech, timer, audio, and auto-advance options are saved", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Deck Options" });

  await options.getByRole("textbox", { name: "Relearning steps" }).fill("10 60");
  await options.getByRole("spinbutton", { name: "New interval percentage" }).fill("25");
  await options.getByRole("spinbutton", { name: "Minimum lapse interval" }).fill("2");
  await options.getByRole("spinbutton", { name: "Leech threshold" }).fill("6");
  await options.getByRole("combobox", { name: "Leech action" }).selectOption("tag-only");
  await options.getByRole("spinbutton", { name: "Ignore answer times longer than" }).fill("45");
  await options.getByLabel("Show answer timer").check();
  await options.getByLabel("Automatically play audio").check();
  await options.getByLabel("Replay question audio with answer").check();
  await options.getByLabel("Stop timer on answer").check();
  await options.getByRole("combobox", { name: "Question auto action" }).selectOption("show-answer");
  await options.getByRole("spinbutton", { name: "Seconds to show question" }).fill("8");
  await options.getByRole("combobox", { name: "Answer auto action" }).selectOption("bury");
  await options.getByRole("spinbutton", { name: "Seconds to show answer" }).fill("12");
  await options.getByLabel("Wait for audio before auto advance").check();
  await options.getByRole("button", { name: "Save deck options" }).click();

  await expect(options.getByText("Lapses: steps 10 60, new interval 25%, min 2d")).toBeVisible();
  await expect(options.getByText("Leech: threshold 6, action tag-only")).toBeVisible();
  await expect(
    options.getByText(
      "Timer/audio: ignore >45s, timer shown, autoplay, replay question audio, stop on answer",
    ),
  ).toBeVisible();
  await expect(
    options.getByText(
      "Auto advance: question show-answer after 8s, answer bury after 12s, wait for audio",
    ),
  ).toBeVisible();
});

test("ANKI-DECK-OPTIONS-039 ANKI-DECK-OPTIONS-040 ANKI-DECK-OPTIONS-041 ANKI-DECK-OPTIONS-042 ANKI-DECK-OPTIONS-043 ANKI-DECK-OPTIONS-044: FSRS options are saved", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Deck Options" });

  await options.getByLabel("Enable FSRS").check();
  await options.getByRole("spinbutton", { name: "Desired retention" }).fill("0.91");
  await options.getByRole("spinbutton", { name: "Historical retention" }).fill("0.86");
  await options.getByRole("textbox", { name: "FSRS parameters" }).fill("0.1,0.2,0.3");
  await options.getByRole("textbox", { name: "FSRS parameter search" }).fill("retention");
  await options.getByRole("textbox", { name: "Ignore review logs before" }).fill("2026-01-01");
  await options.getByLabel("Reschedule cards on change").check();
  await options
    .getByRole("textbox", { name: "Card state customizer" })
    .fill("state.good.interval *= 2");
  await options.getByRole("button", { name: "Run FSRS health check" }).click();
  await options.getByRole("button", { name: "Save deck options" }).click();

  await expect(options.getByText("FSRS: enabled, desired 0.91, historical 0.86")).toBeVisible();
  await expect(options.getByText("FSRS params: 0.1,0.2,0.3; search retention")).toBeVisible();
  await expect(
    options.getByText("FSRS revlogs ignored before 2026-01-01; reschedule enabled"),
  ).toBeVisible();
  await expect(options.getByText("FSRS health check: healthy, optimized 0 days ago")).toBeVisible();
  await expect(
    options.getByText("Card state customizer saved: state.good.interval *= 2"),
  ).toBeVisible();
});
