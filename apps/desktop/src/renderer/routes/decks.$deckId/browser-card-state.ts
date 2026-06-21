import type { CardPreview } from "@orbit/types";

export function getFlagName(flag: number) {
  switch (flag) {
    case 1:
      return "red";
    default:
      return "none";
  }
}

export function getCardStateName(card: CardPreview) {
  if (card.ankiQueue === -1) {
    return "suspended";
  }

  if (card.ankiQueue === -2 || card.ankiQueue === -3) {
    return "buried";
  }

  if (card.ankiType === 0 || card.repetitions === 0) {
    return "new";
  }

  if (card.ankiType === 1) {
    return "learning";
  }

  return "review";
}
