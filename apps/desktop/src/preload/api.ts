import type {
  CardPreview,
  CardType,
  CardWithNote,
  CreateDeckInput,
  CreateNoteInput,
  Deck,
  DeckDetail,
  DeckSummary,
  DeleteDeckResult,
  DueCardsInput,
  ImportAnkiDecksResult,
  ListDeckCardsInput,
  Note,
  NoteType,
  PaginatedResponse,
  PaginationInput,
  ReviewRating,
  ReviewResult,
  SchedulerStatus,
  TodayStudySummary,
  UpdateCardInput,
  UpdateDeckInput,
  UpdateNoteInput,
} from "@orbit/api";

export interface IpcImportAnkiDecksInput {
  data: ArrayBuffer;
  fileName: string;
}

export interface OrbitDesktopApi {
  cards: {
    get(cardId: string): Promise<CardWithNote>;
    update(cardId: string, input: UpdateCardInput): Promise<CardWithNote>;
  };
  decks: {
    create(input: CreateDeckInput): Promise<Deck>;
    delete(deckId: string): Promise<DeleteDeckResult>;
    get(deckId: string): Promise<DeckDetail>;
    importAnki(input: IpcImportAnkiDecksInput): Promise<ImportAnkiDecksResult>;
    list(input?: PaginationInput): Promise<PaginatedResponse<DeckSummary>>;
    listCardTypes(deckId: string, input?: PaginationInput): Promise<PaginatedResponse<CardType>>;
    listCards(deckId: string, input?: ListDeckCardsInput): Promise<PaginatedResponse<CardPreview>>;
    listNoteTypes(deckId: string, input?: PaginationInput): Promise<PaginatedResponse<NoteType>>;
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

declare global {
  interface Window {
    api: OrbitDesktopApi;
  }
}
