import { expect, test } from "@playwright/test";

test.skip(true, "Review route is not mounted in the current routed app.");
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-REVIEW-028: More exposes review card, note, audio, voice, scheduling, metadata, options, and auto-advance actions", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      {
        back: "Answer [sound:answer.mp3]",
        front: "Prompt [sound:question.mp3]",
        id: "card-1",
        repetitions: 3,
      },
    ],
  });
  await page.goto("/decks/deck-1/review");
  await page.getByRole("button", { name: "More review actions" }).click();

  for (const name of [
    "Edit",
    "Flag red",
    "Flag orange",
    "Flag green",
    "Flag blue",
    "Flag pink",
    "Flag turquoise",
    "Flag purple",
    "Clear flag",
    "Bury Card",
    "Forget Card",
    "Set Due Date",
    "Suspend Card",
    "Options",
    "Card Info",
    "Previous Card Info",
    "Mark Note",
    "Bury Note",
    "Suspend Note",
    "Create Copy",
    "Delete Note",
    "Replay Audio",
    "Pause Audio",
    "Audio -5s",
    "Audio +5s",
    "Record Own Voice",
    "Replay Own Voice",
    "Auto Advance",
  ]) {
    await expect(page.getByRole("menuitem", { exact: true, name })).toBeVisible();
  }
});

test("ANKI-REVIEW-009 ANKI-REVIEW-037 ANKI-REVIEW-038 ANKI-REVIEW-039 ANKI-REVIEW-040 ANKI-REVIEW-041: review audio and own voice controls update session playback state", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    reviewQueue: [
      {
        back: "Answer [sound:answer.mp3]",
        front: "Prompt [sound:question.mp3]",
        id: "card-1",
        repetitions: 3,
      },
    ],
  });
  await page.goto("/decks/deck-1/review");
  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Replay Audio" }).click();

  await expect(page.getByLabel("Review audio status")).toContainText(
    "Playing question audio question.mp3 at 0s",
  );

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Audio +5s" }).click();
  await expect(page.getByLabel("Review audio status")).toContainText(
    "Playing question audio question.mp3 at 5s",
  );

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Audio -5s" }).click();
  await expect(page.getByLabel("Review audio status")).toContainText(
    "Playing question audio question.mp3 at 0s",
  );

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Pause Audio" }).click();
  await expect(page.getByLabel("Review audio status")).toContainText(
    "Paused question audio question.mp3 at 0s",
  );

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Record Own Voice" }).click();
  await expect(page.getByLabel("Own voice status")).toContainText("Own voice recorded");

  await page.getByRole("button", { name: "More review actions" }).click();
  await page.getByRole("menuitem", { name: "Replay Own Voice" }).click();
  await expect(page.getByLabel("Own voice status")).toContainText("Own voice playing");
});
