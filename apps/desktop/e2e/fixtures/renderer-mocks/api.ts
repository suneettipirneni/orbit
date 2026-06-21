import type {
  CardPreview,
  CardWithNote,
  CreateDeckInput,
  CreateNoteInput,
  Deck,
  DeckDetail,
  DeckSummary,
  DeleteDeckResult,
  DueCardsInput,
  ImportAnkiDecksInput,
  ImportAnkiDecksResult,
  ListDeckCardsInput,
  Note,
  PaginatedResponse,
  PaginationInput,
  ReviewRating,
  ReviewResult,
  SchedulerStatus,
  TodayStudySummary,
  UpdateCardInput,
  UpdateDeckInput,
  UpdateNoteInput,
} from "@orbit/types";

export interface E2eRendererApi {
  cards: {
    get(cardId: string): Promise<CardWithNote>;
    update(cardId: string, input: UpdateCardInput): Promise<CardWithNote>;
  };
  decks: {
    create(input: CreateDeckInput): Promise<Deck>;
    delete(deckId: string): Promise<DeleteDeckResult>;
    get(deckId: string): Promise<DeckDetail>;
    importAnki(input: ImportAnkiDecksInput): Promise<ImportAnkiDecksResult>;
    list(input?: PaginationInput): Promise<PaginatedResponse<DeckSummary>>;
    listCards(deckId: string, input?: ListDeckCardsInput): Promise<PaginatedResponse<CardPreview>>;
    update(deckId: string, input: UpdateDeckInput): Promise<Deck>;
  };
  notes: {
    create(input: CreateNoteInput): Promise<Note>;
    delete(noteId: string): Promise<void>;
    update(noteId: string, input: UpdateNoteInput): Promise<Note>;
  };
  reviews: {
    listDue(input?: DueCardsInput): Promise<PaginatedResponse<CardWithNote>>;
    schedulerStatus(): Promise<SchedulerStatus>;
    submit(cardId: string, rating: ReviewRating): Promise<ReviewResult>;
    today(): Promise<TodayStudySummary>;
  };
}

export const allDecksCardScope = "__all__";

export function getApi() {
  return window.api as unknown as E2eRendererApi;
}
