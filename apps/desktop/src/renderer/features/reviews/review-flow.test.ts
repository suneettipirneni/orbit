import type { CardWithNote } from "@orbit/api";
import { describe, expect, it } from "vitest";
import { createReviewFlow, getRatingButtons, revealAnswer } from "./review-flow";

describe("review flow", () => {
  it("ANKI-REVIEW-001/002: starts on the question side and reveals answers before ratings", () => {
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

  it("ANKI-REVIEW-003/004/005: uses Anki-style answer button sets", () => {
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
