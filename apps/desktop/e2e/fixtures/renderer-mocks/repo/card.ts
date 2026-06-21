import type { UpdateCardInput } from "@orbit/types";
import { getApi } from "../api";

export function getCard(cardId: string) {
  return getApi().cards.get(cardId);
}

export function updateCard(cardId: string, input: UpdateCardInput) {
  return getApi().cards.update(cardId, input);
}
