# Filtered Decks And Custom Study

## Purpose

Filtered decks and custom study create focused temporary study queues without permanently moving the source cards out of their original decks.

## Filtered Decks

Primary controls:

- Deck name.
- Search query.
- Limit count.
- Selection order.
- Optional second filter with its own query, limit, and order.
- Whether answers should reschedule cards.
- Preview delays for Again, Hard, and Good when not rescheduling normally.
- Whether to create the deck even if no cards match.
- Hint/control for cards that cannot be moved.

Filtered decks can be opened from Tools, from deck overview for an existing filtered deck, or from the Browser using the current search/selection.

User capabilities:

- Create a filtered deck from search criteria.
- Rebuild the filtered deck.
- Empty the filtered deck.
- Study the resulting temporary queue.

## Custom Study

Custom study is a guided workflow for extending or focusing the current deck.

Modes:

- Increase today's new-card limit.
- Increase today's review-card limit.
- Review forgotten cards.
- Review ahead.
- Preview new cards.
- Study by card state or tag.

Card-state choices:

- New cards only.
- Due cards only.
- All review cards in random order.
- All cards in random order without rescheduling.

## Behavior

Filtered decks are explicit deck objects backed by search filters. Custom study is a shortcut that configures a focused study session from common presets.

## Testable Criteria

- ANKI-FILTERED-001: Given Create Filtered Deck opens, when it renders, then controls for deck name, search query, limit, order, and rescheduling are visible.
- ANKI-FILTERED-002: Given the user enters a search query and limit N, when the filtered deck is built, then no more than N matching movable cards are added to the filtered deck.
- ANKI-FILTERED-003: Given a selection order is chosen, when the filtered deck is built, then matching cards are selected according to that order.
- ANKI-FILTERED-004: Given the second filter is disabled, when the deck is built, then only the first filter contributes cards.
- ANKI-FILTERED-005: Given the second filter is enabled with its own query and limit, when the deck is built, then cards can be selected from both filters according to each filter's criteria.
- ANKI-FILTERED-006: Given reschedule based on answers is enabled, when cards are reviewed in the filtered deck, then answer ratings update the original cards' scheduling state.
- ANKI-FILTERED-007: Given reschedule based on answers is disabled, when cards are reviewed in the filtered deck, then cards return without normal schedule advancement.
- ANKI-FILTERED-008: Given rescheduling is disabled and preview delays are configured, when cards are answered, then preview delays control the next appearance timing within the filtered session.
- ANKI-FILTERED-009: Given no cards match the filter and create-even-if-empty is disabled, when the user confirms, then the app does not create a filtered deck.
- ANKI-FILTERED-010: Given no cards match the filter and create-even-if-empty is enabled, when the user confirms, then an empty filtered deck is created.
- ANKI-FILTERED-011: Given a filtered deck exists, when the user activates Rebuild from the overview, then the filtered deck contents are regenerated from its filters.
- ANKI-FILTERED-012: Given a filtered deck contains cards, when the user activates Empty from the overview, then the filtered deck is emptied and cards return to their original decks.
- ANKI-FILTERED-013: Given Create Filtered Deck is opened from Browser while cards are selected, when the dialog opens, then one filter is prefilled from the selected-card search context.
- ANKI-FILTERED-014: Given Create Filtered Deck is opened from Browser with a search but no selected cards, when the dialog opens, then the first filter is prefilled from the current Browser search.
- ANKI-FILTERED-015: Given cards are suspended, buried, already in another filtered deck, or otherwise unmovable, when a filtered deck is built, then those unmovable cards are not moved into the filtered deck and can be explained via the unmovable-cards hint.
- ANKI-CUSTOM-STUDY-001: Given Custom Study opens for a normal deck, when it renders, then modes for increasing new limit, increasing review limit, reviewing forgotten cards, reviewing ahead, previewing new cards, and studying by state/tag are visible.
- ANKI-CUSTOM-STUDY-002: Given the user selects increase today's new-card limit and enters N, when confirmed, then the current deck allows N additional new cards today.
- ANKI-CUSTOM-STUDY-003: Given the user selects increase today's review-card limit and enters N, when confirmed, then the current deck allows N additional reviews today.
- ANKI-CUSTOM-STUDY-004: Given the user selects review forgotten cards, when confirmed, then the session targets cards forgotten in the configured period.
- ANKI-CUSTOM-STUDY-005: Given the user selects review ahead, when confirmed, then the session targets cards due within the configured future window.
- ANKI-CUSTOM-STUDY-006: Given the user selects preview new cards, when confirmed, then the session targets new cards without normal graduation/rescheduling behavior.
- ANKI-CUSTOM-STUDY-007: Given the user selects study by card state or tag, when a card-state option is chosen and confirmed, then the generated session targets that state/tag criteria.
- ANKI-CUSTOM-STUDY-008: Given the user chooses all cards in random order without rescheduling, when the custom study session is completed, then original card scheduling is not advanced by those answers.
