# Statistics

## Purpose

Statistics summarize study activity and collection progress for a deck or the whole collection.

## Primary Surface

- A web-rendered statistics report.
- Scope selector: current deck or whole collection.
- Time range selector: one month, one year, or deck life.
- Deck selector when deck-scoped statistics are shown.
- Close action.

## User Capabilities

- Compare progress for a deck versus the full collection.
- Switch between short-term, yearly, and lifetime views.
- Inspect review history, workload, retention, and related generated charts.

## Behavior

Statistics are rendered into an embedded web view and regenerate when the selected scope or time range changes.

## Testable Criteria

- ANKI-STATS-001: Given the Stats view is opened from the main app, when it renders, then a statistics report is displayed in the dialog web view.
- ANKI-STATS-002: Given the statistics dialog is open, when the user selects deck scope, then the report is generated for the selected deck.
- ANKI-STATS-003: Given the statistics dialog is open, when the user selects collection scope, then the report is generated for the full collection.
- ANKI-STATS-004: Given the statistics dialog is open, when the user selects 1 month, then the report's time window changes to one month.
- ANKI-STATS-005: Given the statistics dialog is open, when the user selects 1 year, then the report's time window changes to one year.
- ANKI-STATS-006: Given the statistics dialog is open, when the user selects deck life, then the report's time window changes to the full available deck history.
- ANKI-STATS-007: Given deck scope is selected, when the user changes the deck selector, then the statistics report regenerates for the newly selected deck.
- ANKI-STATS-008: Given the statistics dialog is open, when the user activates Close, then the statistics dialog closes without changing review data.
