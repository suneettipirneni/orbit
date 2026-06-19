# Deck Overview

## Purpose

The deck overview is the pre-study screen for one selected deck. It summarizes what is due and provides deck-scoped actions.

## Primary Surface

- Deck name.
- Optional deck description, including markdown-rendered descriptions when enabled.
- Due-count table for New, Learning, and To Review.
- Study Now button.
- Bottom actions for Options, Custom Study, Unbury, and Description.

## User Capabilities

- Start a review session for the selected deck.
- Open deck options.
- Edit the deck description.
- Launch custom study for a normal deck.
- Unbury cards when buried cards exist.
- For filtered decks, rebuild or empty the filtered deck.

## Behavior

When no cards are due, the overview shows the completion/congratulations state instead of launching a review. Buried-card counts may appear as adjustments beside due counts. Filtered decks display a special description explaining that cards return to their original decks after study.

## Testable Criteria

- ANKI-DECK-OVERVIEW-001: Given a normal deck is opened, when the overview renders, then the deck name is displayed as the primary heading.
- ANKI-DECK-OVERVIEW-002: Given the deck has a nonempty description, when the overview renders, then the description is displayed below the deck name.
- ANKI-DECK-OVERVIEW-003: Given the deck description is markdown-enabled, when the overview renders, then the rendered description displays formatted markdown output rather than raw markdown syntax.
- ANKI-DECK-OVERVIEW-004: Given a deck has due cards, when the overview renders, then the New, Learning, and To Review counts are shown in a count table.
- ANKI-DECK-OVERVIEW-005: Given a deck has due cards, when the user activates Study Now, then the app enters the review session for that deck.
- ANKI-DECK-OVERVIEW-006: Given a deck has no due cards, when the user attempts to study, then the app remains out of active review and shows the finished/congratulations state.
- ANKI-DECK-OVERVIEW-007: Given a normal deck overview is open, when the user activates Options, then the deck options dialog opens for the current deck.
- ANKI-DECK-OVERVIEW-008: Given a normal deck overview is open, when the user activates Custom Study, then the custom study dialog opens for the current deck.
- ANKI-DECK-OVERVIEW-009: Given buried cards exist in the current deck, when the overview renders, then an Unbury action is available.
- ANKI-DECK-OVERVIEW-010: Given both manually buried cards and scheduler-buried siblings exist, when the user activates Unbury, then the app asks which buried-card category to unbury.
- ANKI-DECK-OVERVIEW-011: Given a filtered deck overview is open, when the overview renders, then Rebuild and Empty actions are available and Custom Study is not the primary bottom action.
- ANKI-DECK-OVERVIEW-012: Given a normal deck overview is open, when the user activates Description and saves new text, then the overview displays the updated deck description.
