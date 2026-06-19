import type { CardWithNote } from "@orbit/api";
import { describe, expect, it } from "vitest";
import {
  compareTypedAnswer,
  createReviewFlow,
  formatAnswerElapsedTime,
  getRatingButtons,
  getTimerElapsedMilliseconds,
  getTrackedAnswerMilliseconds,
  getReviewAudioReference,
  getTypedAnswerPrompt,
  pauseReviewAudio,
  queueReviewAudio,
  replayOwnVoice,
  revealAnswer,
  recordOwnVoice,
  seekReviewAudio,
  startAnswerTimer,
  stopAnswerTimer,
} from "./review-flow";

describe("review flow", () => {
  it("ANKI-REVIEW-001 ANKI-REVIEW-002: starts on the question side and reveals answers before ratings", () => {
    const card = cardFixture({ back: "A", front: "Q", id: "card-1", repetitions: 1 });

    const questionState = createReviewFlow(card);
    const answerState = revealAnswer(questionState);

    expect(questionState).toMatchObject({
      card,
      side: "question",
    });
    expect(getRatingButtons(questionState.card, questionState.side)).toEqual([]);
    expect(answerState).toMatchObject({
      card,
      side: "answer",
    });
    expect(
      getRatingButtons(answerState.card, answerState.side).map((rating) => rating.label),
    ).toEqual(["Again", "Hard", "Good", "Easy"]);
  });

  it("ANKI-REVIEW-003 ANKI-REVIEW-004 ANKI-REVIEW-005: uses Anki-style answer button sets", () => {
    expect(
      getRatingButtons(cardFixture({ ankiQueue: 1, ankiType: 1 }), "answer").map(
        (rating) => rating.label,
      ),
    ).toEqual(["Again", "Good"]);
    expect(
      getRatingButtons(cardFixture({ ankiQueue: 0, ankiType: 0 }), "answer").map(
        (rating) => rating.label,
      ),
    ).toEqual(["Again", "Good", "Easy"]);
    expect(
      getRatingButtons(cardFixture({ ankiQueue: 2, ankiType: 2 }), "answer").map(
        (rating) => rating.label,
      ),
    ).toEqual(["Again", "Hard", "Good", "Easy"]);
  });

  it("ANKI-REVIEW-043: shows typed-answer input when a template references an existing non-empty field", () => {
    expect(getTypedAnswerPrompt(cardFixture({ front: "[[type:Back]]" }))).toEqual({
      error: undefined,
      fieldName: "Back",
      prompt: "",
      side: "front",
      target: "Back",
    });
    expect(getTypedAnswerPrompt(cardFixture({ front: "Translate [[type:Back]]" }))).toEqual({
      error: undefined,
      fieldName: "Back",
      prompt: "Translate ",
      side: "front",
      target: "Back",
    });
  });

  it("ANKI-REVIEW-044 ANKI-REVIEW-008: compares the supplied typed answer with the expected field text", () => {
    expect(compareTypedAnswer(" paris ", "Paris")).toEqual({
      expected: "Paris",
      isCorrect: true,
      supplied: "paris",
    });
    expect(compareTypedAnswer("Lyon", "Paris")).toEqual({
      expected: "Paris",
      isCorrect: false,
      supplied: "Lyon",
    });
  });

  it("ANKI-REVIEW-045: reports unknown typed-answer fields instead of showing an input", () => {
    expect(getTypedAnswerPrompt(cardFixture({ front: "[[type:Country]]" }))).toEqual({
      error: 'Unknown typed-answer field "Country".',
      fieldName: "Country",
      prompt: "",
      side: "front",
      target: undefined,
    });
  });

  it("ANKI-REVIEW-046: removes typed-answer placeholders for empty fields", () => {
    expect(
      getTypedAnswerPrompt(cardFixture({ back: "", front: "Optional [[type:Back]]" })),
    ).toEqual({
      error: undefined,
      fieldName: "Back",
      prompt: "Optional ",
      side: "front",
      target: undefined,
    });
  });

  it("ANKI-REVIEW-047: uses the active cloze text for cloze typed-answer prompts", () => {
    expect(
      getTypedAnswerPrompt(
        cardFixture({
          ankiOrder: 0,
          back: "[[type:cloze:Front]]",
          front: "{{c1::Paris}} is the capital of France",
        }),
      ),
    ).toEqual({
      error: undefined,
      fieldName: "Front",
      prompt: "",
      side: "back",
      target: "Paris",
    });
    expect(
      getTypedAnswerPrompt(
        cardFixture({
          ankiOrder: 1,
          back: "[[type:cloze:Front]]",
          front: "{{c1::Paris}} is in {{c2::France::country}}",
        }),
      ),
    ).toEqual({
      error: undefined,
      fieldName: "Front",
      prompt: "",
      side: "back",
      target: "France",
    });
  });

  it("ANKI-REVIEW-016: formats elapsed answer time for display while reviewing", () => {
    expect(formatAnswerElapsedTime(0)).toBe("0:00");
    expect(formatAnswerElapsedTime(4_900)).toBe("0:04");
    expect(formatAnswerElapsedTime(65_000)).toBe("1:05");
  });

  it("ANKI-REVIEW-017: caps tracked answer time at the configured maximum", () => {
    expect(getTrackedAnswerMilliseconds(15_000, { maxAnswerMilliseconds: 30_000 })).toBe(15_000);
    expect(getTrackedAnswerMilliseconds(45_000, { maxAnswerMilliseconds: 30_000 })).toBe(30_000);
    expect(getTrackedAnswerMilliseconds(45_000, {})).toBe(45_000);
  });

  it("ANKI-REVIEW-026: stops answer timing at reveal instead of rating selection", () => {
    const timer = startAnswerTimer("card-1", 1_000);
    const stoppedTimer = stopAnswerTimer(timer, 4_500);

    expect(getTimerElapsedMilliseconds(stoppedTimer, 10_000)).toBe(3_500);
  });

  it("ANKI-REVIEW-009: finds playable audio on the current review side and queues it", () => {
    const card = cardFixture({
      back: "A [sound:answer.mp3]",
      front: "Q [sound:question.mp3]",
    });

    expect(getReviewAudioReference(card, "question")).toEqual({
      filename: "question.mp3",
      side: "question",
    });
    expect(queueReviewAudio(card, "answer")).toEqual({
      filename: "answer.mp3",
      positionSeconds: 0,
      side: "answer",
      status: "playing",
    });
  });

  it("ANKI-REVIEW-037 ANKI-REVIEW-038 ANKI-REVIEW-039: pauses and seeks queued review audio", () => {
    const audio = queueReviewAudio(cardFixture({ front: "[sound:question.mp3]" }), "question")!;

    expect(pauseReviewAudio(audio)).toMatchObject({ status: "paused" });
    expect(seekReviewAudio({ ...audio, positionSeconds: 8 }, -5)).toMatchObject({
      positionSeconds: 3,
    });
    expect(seekReviewAudio({ ...audio, positionSeconds: 8 }, 5)).toMatchObject({
      positionSeconds: 13,
    });
    expect(seekReviewAudio({ ...audio, positionSeconds: 2 }, -5)).toMatchObject({
      positionSeconds: 0,
    });
  });

  it("ANKI-REVIEW-040 ANKI-REVIEW-041: records and replays own voice for the review session", () => {
    const recording = recordOwnVoice("card-1", 1_000);

    expect(recording).toEqual({
      cardId: "card-1",
      recordedAtMs: 1_000,
      status: "recorded",
    });
    expect(replayOwnVoice(recording)).toEqual({
      cardId: "card-1",
      recordedAtMs: 1_000,
      status: "playing",
    });
  });
});

function cardFixture(input: Partial<CardWithNote> = {}): CardWithNote {
  return {
    ankiCardType: null,
    ankiData: null,
    ankiDeckId: null,
    ankiDue: null,
    ankiFactor: null,
    ankiFlags: null,
    ankiId: null,
    ankiInterval: null,
    ankiLapses: null,
    ankiLeft: null,
    ankiModifiedAt: null,
    ankiNoteId: null,
    ankiOrder: null,
    ankiOriginalDeckId: null,
    ankiOriginalDue: null,
    ankiQueue: null,
    ankiRepetitions: null,
    ankiTags: [],
    ankiType: null,
    ankiUpdateSequenceNumber: null,
    back: "Back",
    cardTypeId: null,
    createdAt: "2026-06-19T00:00:00.000Z",
    deckId: "deck-1",
    deckName: "Deck",
    dueAt: "2026-06-19T00:00:00.000Z",
    easeFactor: 2.5,
    front: "Front",
    id: "card-1",
    intervalDays: 0,
    lapses: 0,
    noteId: "note-1",
    repetitions: 0,
    updatedAt: "2026-06-19T00:00:00.000Z",
    ...input,
  };
}
