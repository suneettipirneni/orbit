import type {
  CreateDeckInput,
  ImportAnkiDecksInput,
  ListDeckCardsInput,
  PaginationInput,
  UpdateDeckInput,
} from "@orbit/types";
import { allDecksCardScope, getApi } from "../api";

export { allDecksCardScope };

export function listDecks(input: PaginationInput = {}) {
  return getApi().decks.list(input);
}

export function getDeck(deckId: string) {
  return getApi().decks.get(deckId);
}

export function listDeckCards(deckId: string, input: ListDeckCardsInput = {}) {
  return getApi().decks.listCards(deckId, input);
}

export function createDeck(input: CreateDeckInput) {
  return getApi().decks.create(input);
}

export function updateDeck(deckId: string, input: UpdateDeckInput) {
  return getApi().decks.update(deckId, input);
}

export function deleteDeck(deckId: string) {
  return getApi().decks.delete(deckId);
}

export function importAnkiDecks(input: ImportAnkiDecksInput) {
  return getApi().decks.importAnki(input);
}
