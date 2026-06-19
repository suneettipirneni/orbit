import type { CardWithNote, ReviewRating } from "@orbit/api";

export type ReviewSide = "question" | "answer";

export interface ReviewFlowState {
  card: CardWithNote;
  side: ReviewSide;
}

export interface RatingButton {
  label: "Again" | "Hard" | "Good" | "Easy";
  value: ReviewRating["value"];
}

export function createReviewFlow(card: CardWithNote): ReviewFlowState {
  return {
    card,
    side: "question",
  };
}

export function revealAnswer(state: ReviewFlowState): ReviewFlowState {
  return {
    ...state,
    side: "answer",
  };
}

export function getRatingButtons(card: CardWithNote, side: ReviewSide): RatingButton[] {
  if (side === "question") {
    return [];
  }

  switch (getAnswerButtonCount(card)) {
    case 2:
      return [
        { label: "Again", value: 1 },
        { label: "Good", value: 4 },
      ];
    case 3:
      return [
        { label: "Again", value: 1 },
        { label: "Good", value: 4 },
        { label: "Easy", value: 5 },
      ];
    default:
      return [
        { label: "Again", value: 1 },
        { label: "Hard", value: 3 },
        { label: "Good", value: 4 },
        { label: "Easy", value: 5 },
      ];
  }
}

function getAnswerButtonCount(card: CardWithNote) {
  if (card.ankiQueue === 1 || card.ankiType === 1) {
    return 2;
  }

  if (card.ankiQueue === 0 || card.ankiType === 0) {
    return 3;
  }

  if (card.ankiQueue === null && card.ankiType === null && card.repetitions === 0) {
    return 3;
  }

  return 4;
}
