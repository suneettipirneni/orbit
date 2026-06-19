# Deck Library

## Purpose

The deck library is Anki's home screen. It lets a user see all local decks, inspect due counts, choose a deck to study, and perform deck-level management actions.

## Primary Surface

- A tree/table of decks with columns for New, Learn, and Review counts.
- Nested deck hierarchy with expand/collapse controls.
- Current deck indication.
- A studied-today summary below the deck list.
- Bottom actions for shared deck discovery, deck creation, and file import.

## User Capabilities

- Open a deck by selecting it from the deck tree.
- Create a new deck.
- Import a file into the collection.
- Collapse and expand deck groups.
- Reorder or reparent decks by drag and drop.
- Open the deck row options menu.
- Rename a deck from the deck row options menu.
- Open deck options from the deck row options menu.
- Export a deck from the deck row options menu.
- Delete a deck from the deck row options menu.
- Select a deck without opening it when needed for deck operations.
- See scheduler upgrade messaging when the collection requires a scheduler upgrade.

## Behavior

Deck counts are derived from the scheduler's due tree. Parent decks aggregate child counts. Selecting a deck sets the collection's current deck and moves the user into the deck overview. The deck library refreshes when study queues or deck structure changes.

## Testable Criteria

- ANKI-DECK-LIB-001: Given at least one deck exists, when the deck library opens, then each visible deck row shows the deck name and New, Learn, and Review count columns.
- ANKI-DECK-LIB-002: Given a deck has child decks, when the user toggles the deck's collapse control, then the child rows become hidden when collapsed and visible when expanded.
- ANKI-DECK-LIB-003: Given a deck row is selected/opened, when the user activates that row, then the app navigates to the deck overview for that exact deck.
- ANKI-DECK-LIB-004: Given a deck is the current deck, when the deck library is rendered, then that deck row is visually marked as current.
- ANKI-DECK-LIB-005: Given the scheduler reports nonzero due counts for a deck, when the deck library renders, then the deck row displays those counts in the New, Learn, and Review columns without requiring the deck to be opened.
- ANKI-DECK-LIB-006: Given a parent deck has child decks with due counts, when the deck library renders, then the parent row count reflects the aggregate scheduler due tree for that parent.
- ANKI-DECK-LIB-007: Given the user activates Create Deck, when a valid deck name is submitted, then a deck with that name appears in the deck tree.
- ANKI-DECK-LIB-008: Given the user activates Import File, when the file picker/dialog flow is invoked, then the app enters the import workflow rather than changing the selected deck.
- ANKI-DECK-LIB-009: Given the user opens a deck's options control from the deck list, when the control is activated, then the deck options dialog is opened for that deck.
- ANKI-DECK-LIB-010: Given the user drags one deck onto another deck, when the drag is completed, then the moved deck becomes a child of the target deck.
- ANKI-DECK-LIB-011: Given study activity has occurred today, when the deck library renders, then the studied-today summary shows today's studied card count and elapsed review time.
- ANKI-DECK-LIB-012: Given a deck row's gear/options control is activated, when the menu opens, then Rename, Options, Export, and Delete actions are available.
- ANKI-DECK-LIB-013: Given Rename is selected for a deck, when the user submits a nonempty new name different from the old name, then the deck row displays the new name.
- ANKI-DECK-LIB-014: Given Rename is selected for a deck, when the user submits an empty name or the same name, then no deck rename occurs.
- ANKI-DECK-LIB-015: Given Export is selected for a deck, when the export dialog opens, then that deck is selected as the export scope.
- ANKI-DECK-LIB-016: Given Delete is selected for a deck and confirmed, when deletion completes, then the deck is removed and the app reports how many cards were deleted with that deck.
- ANKI-DECK-LIB-017: Given a deck is dragged to the top-level drag row, when the drag completes, then the deck becomes a top-level deck.
- ANKI-DECK-LIB-018: Given the collection requires a scheduler upgrade, when the deck library renders, then an upgrade callout with update and more-info actions is visible.

## Out Of Scope

The Get Shared entry point opens shared deck discovery and is excluded from this pass.
