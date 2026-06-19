import type { Page } from "@playwright/test";

export interface MockOrbitApiOptions {
  childDeckCounts?: {
    learningCards: number;
    newCards: number;
    reviewCards: number;
  };
  browserCards?: Array<{
    back: string;
    front: string;
    id: string;
    noteId?: string;
    repetitions?: number;
  }>;
  description?: string | null;
  includeBuriedCards?: boolean;
  includeDragTargetDeck?: boolean;
  importDelayMs?: number;
  noDueCards?: boolean;
  requiresSchedulerUpgrade?: boolean;
  reviewQueue?: Array<{
    back: string;
    dueAt?: string;
    front: string;
    flag?: number;
    id: string;
    noteId?: string;
    noteTags?: string[];
    repetitions?: number;
  }>;
  todayStudySummary?: {
    elapsedSeconds: number;
    studiedCards: number;
  };
}

export async function mockOrbitApi(page: Page, options: MockOrbitApiOptions = {}) {
  await page.addInitScript((mockOptions) => {
    const now = "2026-06-19T12:00:00.000Z";
    const description = mockOptions.description ?? "Default deck";
    const dueCardCount = mockOptions.noDueCards ? 0 : 1;
    const reviewCardCount = mockOptions.noDueCards ? 0 : 1;
    const childNewCardCount = mockOptions.childDeckCounts?.newCards ?? 0;
    const childLearningCardCount = mockOptions.childDeckCounts?.learningCards ?? 0;
    const childReviewCardCount = mockOptions.childDeckCounts?.reviewCards ?? 0;
    const childDueCardCount = childNewCardCount + childLearningCardCount + childReviewCardCount;
    const reviewQueue = mockOptions.reviewQueue ?? [
      {
        back: "Paris",
        front: "Capital of France",
        id: "card-1",
        repetitions: 0,
      },
    ];
    const activeReviewQueue = mockOptions.noDueCards ? [] : [...reviewQueue];
    (
      window as unknown as {
        __orbitCardUpdates: Array<{ cardId: string; input: Record<string, unknown> }>;
        __orbitNoteCreates: Array<{ back: string; deckId: string; front: string }>;
        __orbitNoteUpdates: Array<{ input: Record<string, unknown>; noteId: string }>;
        __orbitReviewSubmissions: Array<{ cardId: string; rating: { value: number } }>;
      }
    ).__orbitCardUpdates = [];
    (
      window as unknown as {
        __orbitNoteCreates: Array<{ back: string; deckId: string; front: string }>;
      }
    ).__orbitNoteCreates = [];
    (
      window as unknown as {
        __orbitNoteUpdates: Array<{ input: Record<string, unknown>; noteId: string }>;
      }
    ).__orbitNoteUpdates = [];
    (
      window as unknown as {
        __orbitCardUpdates: Array<{ cardId: string; input: Record<string, unknown> }>;
        __orbitReviewSubmissions: Array<{ cardId: string; rating: { value: number } }>;
      }
    ).__orbitReviewSubmissions = [];
    const activeDueCardCount = activeReviewQueue.length;
    const decks = [
      {
        createdAt: now,
        description,
        dueCards: activeDueCardCount || dueCardCount,
        id: "deck-1",
        learningCards: 0,
        name: "Default",
        newCards: activeDueCardCount || dueCardCount,
        reviewCards: activeDueCardCount || reviewCardCount,
        totalCards: 2,
        updatedAt: now,
      },
      {
        createdAt: now,
        description: null,
        dueCards: childDueCardCount,
        id: "deck-2",
        learningCards: childLearningCardCount,
        name: "Default::Biology",
        newCards: childNewCardCount,
        reviewCards: childReviewCardCount,
        totalCards: childDueCardCount,
        updatedAt: now,
      },
    ];

    if (mockOptions.includeDragTargetDeck) {
      decks.push({
        createdAt: now,
        description: null,
        dueCards: 0,
        id: "deck-3",
        learningCards: 0,
        name: "Chemistry",
        newCards: 0,
        reviewCards: 0,
        totalCards: 0,
        updatedAt: now,
      });
    }
    const cards = [
      {
        ankiCardType: "Front",
        ankiDue: 1,
        ankiFlags: 0,
        ankiOrder: 0,
        ankiQueue: 0,
        ankiSortField: "Capital of France",
        ankiTags: reviewQueue.find((card) => card.id === "card-1")?.noteTags ?? [],
        ankiType: 0,
        back: "Paris",
        cardTypeId: "card-type-1",
        deckId: "deck-1",
        deckName: "Default",
        dueAt: now,
        front: "Capital of France",
        id: "card-1",
        intervalDays: 0,
        noteId: "note-1",
        repetitions: 0,
      },
      {
        ankiCardType: "Front",
        ankiDue: 2,
        ankiFlags: 0,
        ankiOrder: 1,
        ankiQueue: 2,
        ankiSortField: "Largest planet",
        ankiTags: reviewQueue.find((card) => card.id === "card-2")?.noteTags ?? ["science"],
        ankiType: 2,
        back: "Jupiter",
        cardTypeId: "card-type-1",
        deckId: "deck-1",
        deckName: "Default",
        dueAt: now,
        front: "Largest planet",
        id: "card-2",
        intervalDays: 5,
        noteId: "note-2",
        repetitions: 3,
      },
    ];

    if (mockOptions.browserCards) {
      cards.splice(
        0,
        cards.length,
        ...mockOptions.browserCards.map((card, index) => ({
          ankiCardType: "Front",
          ankiDue: index + 1,
          ankiFlags: 0,
          ankiOrder: index,
          ankiQueue: card.repetitions && card.repetitions > 0 ? 2 : 0,
          ankiSortField: card.front,
          ankiTags: [],
          ankiType: card.repetitions && card.repetitions > 0 ? 2 : 0,
          back: card.back,
          cardTypeId: "card-type-1",
          deckId: "deck-1",
          deckName: "Default",
          dueAt: now,
          front: card.front,
          id: card.id,
          intervalDays: card.repetitions && card.repetitions > 0 ? 5 : 0,
          noteId: card.noteId ?? `note-${index + 1}`,
          repetitions: card.repetitions ?? 0,
        })),
      );
    }

    if (mockOptions.includeBuriedCards) {
      cards.push(
        {
          ankiCardType: "Front",
          ankiDue: 3,
          ankiFlags: 0,
          ankiOrder: 2,
          ankiQueue: -2,
          ankiSortField: "Manual buried",
          ankiTags: [],
          ankiType: 2,
          back: "Manual answer",
          cardTypeId: "card-type-1",
          deckId: "deck-1",
          deckName: "Default",
          dueAt: now,
          front: "Manual buried",
          id: "card-3",
          intervalDays: 1,
          noteId: "note-3",
          repetitions: 1,
        },
        {
          ankiCardType: "Front",
          ankiDue: 4,
          ankiFlags: 0,
          ankiOrder: 3,
          ankiQueue: -3,
          ankiSortField: "Sibling buried",
          ankiTags: [],
          ankiType: 2,
          back: "Sibling answer",
          cardTypeId: "card-type-1",
          deckId: "deck-1",
          deckName: "Default",
          dueAt: now,
          front: "Sibling buried",
          id: "card-4",
          intervalDays: 1,
          noteId: "note-4",
          repetitions: 1,
        },
      );
    }

    window.api = {
      cards: {
        get: () =>
          Promise.resolve({
            ...cards[0],
            createdAt: now,
            easeFactor: 2.5,
            lapses: 0,
            updatedAt: now,
          }),
        update: (
          cardId: string,
          input: {
            buried?: boolean;
            deckId?: string;
            dueAt?: string;
            flag?: number;
            forget?: boolean;
            position?: number;
            suspended?: boolean;
          },
        ) => {
          (
            window as unknown as {
              __orbitCardUpdates: Array<{ cardId: string; input: Record<string, unknown> }>;
            }
          ).__orbitCardUpdates.push({ cardId, input });
          const queuedCard = activeReviewQueue.find((card) => card.id === cardId);

          if (queuedCard && input.flag !== undefined) {
            queuedCard.flag = input.flag;
          }

          if (queuedCard && input.forget) {
            queuedCard.dueAt = now;
            queuedCard.repetitions = 0;
          }

          if (queuedCard && input.dueAt) {
            queuedCard.dueAt = input.dueAt;
          }

          const storedCard = cards.find((card) => card.id === cardId);

          if (storedCard) {
            if (input.deckId) {
              const targetDeck = decks.find((deckOption) => deckOption.id === input.deckId);

              storedCard.deckId = input.deckId;
              storedCard.deckName = targetDeck?.name ?? storedCard.deckName;
            }

            if (input.flag !== undefined) {
              storedCard.ankiFlags = input.flag;
            }

            if (input.position !== undefined) {
              storedCard.ankiDue = input.position;
              storedCard.ankiOrder = input.position;
            }

            if (input.dueAt) {
              storedCard.dueAt = input.dueAt;
            }

            if (input.forget) {
              storedCard.ankiQueue = 0;
              storedCard.ankiType = 0;
              storedCard.intervalDays = 0;
              storedCard.repetitions = 0;
            } else if (input.buried) {
              storedCard.ankiQueue = -2;
            } else if (input.suspended !== undefined) {
              storedCard.ankiQueue = input.suspended ? -1 : storedCard.repetitions > 0 ? 2 : 0;
            }
          }

          if (input.buried || input.suspended) {
            const cardIndex = activeReviewQueue.findIndex((card) => card.id === cardId);

            if (cardIndex !== -1) {
              activeReviewQueue.splice(cardIndex, 1);
            }
          }

          if (input.dueAt && input.dueAt > now) {
            const cardIndex = activeReviewQueue.findIndex((card) => card.id === cardId);

            if (cardIndex !== -1) {
              activeReviewQueue.splice(cardIndex, 1);
            }
          }

          return Promise.resolve({
            ...(cards.find((card) => card.id === cardId) ?? cards[0]),
            ...queuedCard,
            ankiFlags: input.flag ?? queuedCard?.flag ?? 0,
            ankiQueue: queuedCard?.repetitions && queuedCard.repetitions > 0 ? 2 : 0,
            ankiType: queuedCard?.repetitions && queuedCard.repetitions > 0 ? 2 : 0,
            createdAt: now,
            dueAt: queuedCard?.dueAt ?? input.dueAt ?? now,
            easeFactor: 2.5,
            intervalDays: input.forget ? 0 : 0,
            lapses: 0,
            repetitions: queuedCard?.repetitions ?? 0,
            updatedAt: now,
          });
        },
      },
      decks: {
        create: (input: { description?: null | string; name: string }) => {
          const deck = {
            createdAt: now,
            description: null,
            ...input,
            dueCards: 0,
            id: `deck-${decks.length + 1}`,
            learningCards: 0,
            newCards: 0,
            reviewCards: 0,
            totalCards: 0,
            updatedAt: now,
          };

          decks.push(deck);

          return Promise.resolve(deck);
        },
        delete: (deckId: string) => {
          const deckIndex = decks.findIndex((deck) => deck.id === deckId);

          if (deckIndex !== -1) {
            decks.splice(deckIndex, 1);
          }

          return Promise.resolve({ deletedCards: 2 });
        },
        get: (deckId: string) => {
          const deck = decks.find((deckOption) => deckOption.id === deckId) ?? decks[0]!;

          return Promise.resolve({
            counts: {
              due: deck.dueCards,
              learning: deck.learningCards,
              new: deck.newCards,
              review: deck.reviewCards,
              total: cards.length,
            },
            deck: {
              createdAt: deck.createdAt,
              description: deck.description,
              id: deck.id,
              name: deck.name,
              updatedAt: deck.updatedAt,
            },
          });
        },
        importAnki: () =>
          new Promise((resolve) => {
            window.setTimeout(() => {
              resolve({ cardCount: 0, deckCount: 0, decks: [], noteCount: 0 });
            }, mockOptions.importDelayMs ?? 0);
          }),
        list: () =>
          Promise.resolve({
            data: decks,
            pagination: { page: 1, pageCount: 1, pageSize: 100, total: decks.length },
          }),
        listCardTypes: () =>
          Promise.resolve({
            data: [],
            pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
          }),
        listCards: (
          _deckId: string,
          input: {
            page?: number;
            pageSize?: number;
            query?: string;
            searchWithinFormatting?: boolean;
          } = {},
        ) => {
          const query = input.query?.trim().toLowerCase();
          const filteredCards = query
            ? cards.filter((card) => {
                const front = input.searchWithinFormatting ? card.front : stripMarkup(card.front);
                const back = input.searchWithinFormatting ? card.back : stripMarkup(card.back);

                return front.toLowerCase().includes(query) || back.toLowerCase().includes(query);
              })
            : cards;

          return Promise.resolve({
            data: filteredCards,
            pagination: {
              page: input.page ?? 1,
              pageCount: 1,
              pageSize: input.pageSize ?? 10,
              total: filteredCards.length,
            },
          });
        },
        listNoteTypes: () =>
          Promise.resolve({
            data: [],
            pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
          }),
        update: (deckId: string, input: { description?: null | string; name?: string }) => {
          const deck = decks.find((deckOption) => deckOption.id === deckId);
          const updatedDeck = {
            createdAt: now,
            description: deck?.description ?? "Default deck",
            id: deckId,
            name: deck?.name ?? "Default",
            updatedAt: now,
            ...input,
          };

          if (deck) {
            Object.assign(deck, updatedDeck);
          }

          return Promise.resolve(updatedDeck);
        },
      },
      notes: {
        create: (input: { back: string; deckId: string; front: string }) => {
          (
            window as unknown as {
              __orbitNoteCreates: Array<{ back: string; deckId: string; front: string }>;
            }
          ).__orbitNoteCreates.push(input);

          return Promise.resolve({
            ankiChecksum: null,
            ankiData: null,
            ankiFieldNames: null,
            ankiFields: null,
            ankiFlags: null,
            ankiGuid: null,
            ankiId: null,
            ankiModelId: null,
            ankiModifiedAt: null,
            ankiSortField: input.front,
            ankiTags: [],
            ankiUpdateSequenceNumber: null,
            createdAt: now,
            id: "note-new",
            noteTypeId: null,
            updatedAt: now,
            ...input,
          });
        },
        delete: (noteId: string) => {
          for (let index = activeReviewQueue.length - 1; index >= 0; index -= 1) {
            if ((activeReviewQueue[index]?.noteId ?? `note-${index + 1}`) === noteId) {
              activeReviewQueue.splice(index, 1);
            }
          }

          for (let index = cards.length - 1; index >= 0; index -= 1) {
            if (cards[index]?.noteId === noteId) {
              cards.splice(index, 1);
            }
          }

          return Promise.resolve(undefined);
        },
        update: (
          noteId: string,
          input: {
            addTags?: string[];
            back?: string;
            buried?: boolean;
            front?: string;
            marked?: boolean;
            removeTags?: string[];
            suspended?: boolean;
          },
        ) => {
          (
            window as unknown as {
              __orbitNoteUpdates: Array<{ input: Record<string, unknown>; noteId: string }>;
            }
          ).__orbitNoteUpdates.push({ input, noteId });
          for (const card of activeReviewQueue) {
            if ((card.noteId ?? `note-${activeReviewQueue.indexOf(card) + 1}`) === noteId) {
              const tags = new Set(card.noteTags ?? []);

              for (const tag of input.addTags ?? []) {
                tags.add(tag);
              }

              for (const tag of input.removeTags ?? []) {
                tags.delete(tag);
              }

              if (input.marked === true) {
                tags.add("marked");
              } else if (input.marked === false) {
                tags.delete("marked");
              }

              card.noteTags = [...tags];
              card.back = input.back ?? card.back;
              card.front = input.front ?? card.front;
            }
          }

          for (const card of cards) {
            if (card.noteId === noteId) {
              const tags = new Set(card.ankiTags ?? []);

              for (const tag of input.addTags ?? []) {
                tags.add(tag);
              }

              for (const tag of input.removeTags ?? []) {
                tags.delete(tag);
              }

              if (input.marked === true) {
                tags.add("marked");
              } else if (input.marked === false) {
                tags.delete("marked");
              }

              card.ankiTags = [...tags];
              card.back = input.back ?? card.back;
              card.front = input.front ?? card.front;
              card.ankiSortField = input.front ?? card.ankiSortField;
            }
          }

          if (input.buried || input.suspended) {
            for (let index = activeReviewQueue.length - 1; index >= 0; index -= 1) {
              if ((activeReviewQueue[index]?.noteId ?? `note-${index + 1}`) === noteId) {
                activeReviewQueue.splice(index, 1);
              }
            }
          }

          return Promise.resolve({
            ankiChecksum: null,
            ankiData: null,
            ankiFieldNames: null,
            ankiFields: null,
            ankiFlags: null,
            ankiGuid: null,
            ankiId: null,
            ankiModelId: null,
            ankiModifiedAt: null,
            ankiSortField: input.front ?? "Capital of France",
            ankiTags:
              activeReviewQueue.find((card) => (card.noteId ?? "note-1") === noteId)?.noteTags ??
              [],
            ankiUpdateSequenceNumber: null,
            back: input.back ?? "Paris",
            createdAt: now,
            deckId: "deck-1",
            front: input.front ?? "Capital of France",
            id: noteId,
            noteTypeId: null,
            updatedAt: now,
          });
        },
      },
      reviews: {
        listDue: () =>
          Promise.resolve({
            data: activeReviewQueue.map((card, index) => ({
              ankiCardType: "Front",
              ankiData: null,
              ankiDeckId: null,
              ankiDue: index + 1,
              ankiFactor: null,
              ankiFlags: card.flag ?? 0,
              ankiId: null,
              ankiInterval: null,
              ankiLapses: null,
              ankiLeft: null,
              ankiModifiedAt: null,
              ankiNoteId: null,
              ankiOrder: index,
              ankiOriginalDeckId: null,
              ankiOriginalDue: null,
              ankiQueue: card.repetitions && card.repetitions > 0 ? 2 : 0,
              ankiRepetitions: null,
              ankiType: card.repetitions && card.repetitions > 0 ? 2 : 0,
              ankiTags: card.noteTags ?? [],
              ankiUpdateSequenceNumber: null,
              back: card.back,
              cardTypeId: "card-type-1",
              createdAt: now,
              deckId: "deck-1",
              deckName: "Default",
              dueAt: card.dueAt ?? now,
              easeFactor: 2.5,
              front: card.front,
              id: card.id,
              intervalDays: 0,
              lapses: 0,
              noteId: card.noteId ?? `note-${index + 1}`,
              repetitions: card.repetitions ?? 0,
              updatedAt: now,
            })),
            pagination: {
              page: 1,
              pageCount: 1,
              pageSize: 10,
              total: activeReviewQueue.length,
            },
          }),
        schedulerStatus: () =>
          Promise.resolve({
            upgradeRequired: mockOptions.requiresSchedulerUpgrade ?? false,
          }),
        submit: (cardId: string, rating: { value: number }) => {
          (
            window as unknown as {
              __orbitReviewSubmissions: Array<{ cardId: string; rating: { value: number } }>;
            }
          ).__orbitReviewSubmissions.push({ cardId, rating });
          const reviewedCardIndex = activeReviewQueue.findIndex((card) => card.id === cardId);
          const reviewedCard =
            reviewedCardIndex === -1
              ? activeReviewQueue[0]
              : activeReviewQueue.splice(reviewedCardIndex, 1)[0];

          return Promise.resolve({
            card: {
              ...cards[0],
              ...reviewedCard,
              createdAt: now,
              easeFactor: 2.5,
              lapses: 0,
              updatedAt: now,
            },
            rating: "good",
          });
        },
        today: () =>
          Promise.resolve(
            mockOptions.todayStudySummary ?? {
              elapsedSeconds: 0,
              studiedCards: 0,
            },
          ),
      },
    } as unknown as typeof window.api;

    function stripMarkup(value: string) {
      return value.replace(/<[^>]*>/g, "");
    }
  }, options);
}
