# Anki Feature Map

This directory documents Anki's desktop feature surface as crawled from the running macOS app and the installed Anki Qt/Python UI package.

Scope:

- Included: deck library, deck overview, reviewing, authoring, browsing/search, note types, card templates, scheduling options, filtered/custom study, statistics, import/export, backups, maintenance, and local preferences.
- Excluded for now: add-ons, sync, AnkiWeb account flows, and shared-deck discovery/update workflows.

## Hierarchy

- Core study workflow
  - [Deck library](core/deck-library.md)
  - [Deck overview](core/deck-overview.md)
  - [Review session](core/review-session.md)
  - [Statistics](core/statistics.md)
- Authoring and library management
  - [Add notes](authoring/add-notes.md)
  - [Browser, search, and bulk editing](authoring/browser-search-bulk-editing.md)
  - [Note types, fields, and card templates](authoring/note-types-fields-templates.md)
- Scheduling and focused study
  - [Deck options and scheduling](scheduling/deck-options.md)
  - [Filtered decks and custom study](scheduling/filtered-decks-custom-study.md)
- Data and collection operations
  - [Card and note schemas](data/card-note-schemas.md)
  - [Import and export](data/import-export.md)
  - [Backups and maintenance](data/backups-maintenance.md)
- System preferences
  - [Preferences](system/preferences.md)

## Crawl Notes

The live main window exposed the top navigation: Decks, Add, Browse, Stats, and Sync, plus deck actions for Get Shared, Create Deck, and Import File. Sync and Get Shared were treated as out of scope. The app menu exposed File, Edit, View, Tools, and Help workflows. Dialog and menu details were cross-checked against the installed Anki UI modules under `aqt` and `_aqt.forms`.

## Criteria Format

Each feature file includes testable criteria with stable IDs. Criteria are written as observable app behavior:

- Preconditions define the collection or UI state needed before a test starts.
- Action defines the user or system event to perform.
- Expected result defines what the app must show, change, or preserve.
- Out-of-scope network, sync, and add-on behavior should not be inferred from these criteria.
