# Import And Export

## Purpose

Import and export move collection data into or out of Anki while preserving enough structure for decks, notes, cards, media, scheduling, and metadata depending on the chosen format and options.

## Import

Primary controls:

- Target note type.
- Target deck.
- Auto-detect controls for import structure.
- Import mode:
  - Update existing notes when the first field matches.
  - Ignore lines where the first field matches an existing note.
  - Import even if an existing note has the same first field.
- Allow HTML in fields.
- Tag modified notes.
- Field mapping area.

Supported import families found in the app:

- Text separated by tabs or semicolons.
- Packaged Anki deck/collection files such as `.apkg`, `.colpkg`, and zip-like package imports.
- Mnemosyne 2.0 `.db` imports.

Newer import screens are web-rendered flows for CSV/text imports and Anki package imports. They keep the same core concepts: source file, target deck/note type where applicable, field mapping, duplicate/update behavior, HTML handling, tags for modified notes, and an import log.

User capabilities:

- Import packaged decks or text-like data.
- Map incoming fields onto note fields.
- Decide duplicate/update behavior.
- Assign incoming notes to a deck and note type.
- Tag changed notes for later review.

## Export

Primary controls:

- Export format.
- Deck/include selector.
- Include scheduling information.
- Include deck configurations.
- Include media.
- Include HTML and media references.
- Include tags.
- Include deck.
- Include note type.
- Include GUID.
- Support older Anki versions.

User capabilities:

- Export a deck or broader collection slice.
- Choose how portable and complete the exported file should be.
- Omit scheduling or identifiers for clean sharing, or include them for backup/migration workflows.

Export formats:

- Anki deck package (`.apkg`): optionally limited to all decks or one deck; can include scheduling, deck configs, media, and older-version compatibility.
- Anki collection package (`.colpkg`): exports the collection; can include media and older-version compatibility.
- Notes in plain text (`.txt`): can include HTML, tags, deck, note type, and GUID.
- Cards in plain text (`.txt`): can include HTML.

The export dialog changes which options are visible based on selected format.

## Testable Criteria

- ANKI-IMPORT-001: Given Import opens for a supported file, when it renders, then target note type and target deck selectors are visible.
- ANKI-IMPORT-002: Given Import opens for a file with fields, when it renders, then the field mapping area lists import fields and allows mapping to note fields.
- ANKI-IMPORT-003: Given the user selects a target note type, when field mapping renders, then available destination fields match the selected note type.
- ANKI-IMPORT-004: Given the user selects a target deck, when import is confirmed, then imported cards are assigned to that deck unless the import file specifies deck behavior that is preserved.
- ANKI-IMPORT-005: Given import mode is update-existing-by-first-field, when an incoming row's first field matches an existing note, then the existing note is updated instead of a duplicate note being created.
- ANKI-IMPORT-006: Given import mode is ignore-duplicates-by-first-field, when an incoming row's first field matches an existing note, then that row is skipped.
- ANKI-IMPORT-007: Given import mode is import-even-if-duplicate, when an incoming row's first field matches an existing note, then a separate note is imported.
- ANKI-IMPORT-008: Given Allow HTML in fields is enabled, when imported field text contains HTML, then the HTML is preserved as field content.
- ANKI-IMPORT-009: Given Allow HTML in fields is disabled, when imported field text contains HTML, then the HTML is escaped or treated as plain text according to import behavior.
- ANKI-IMPORT-010: Given Tag modified notes is configured, when import updates existing notes, then updated notes receive the configured tag.
- ANKI-IMPORT-011: Given auto-detect is activated for a text import, when detection succeeds, then delimiter/mapping assumptions update to detected values.
- ANKI-IMPORT-012: Given a text-separated file is selected, when Import opens, then the CSV/text import flow is used.
- ANKI-IMPORT-013: Given an Anki package file is selected, when Import opens, then the Anki package import flow is used.
- ANKI-IMPORT-014: Given a Mnemosyne `.db` file is selected, when Import opens, then the Mnemosyne importer is selected where supported.
- ANKI-IMPORT-015: Given import completes successfully, when the import log is shown, then it reports added, updated, ignored, or failed items according to the import result.
- ANKI-IMPORT-016: Given imported package media filenames conflict with existing media, when import completes, then media references are transformed to point to the imported or renamed media files.
- ANKI-EXPORT-001: Given Export opens, when it renders, then export format and include-scope controls are visible.
- ANKI-EXPORT-002: Given a deck is selected for export, when the export is confirmed, then exported content is limited to that deck scope.
- ANKI-EXPORT-003: Given Include scheduling information is enabled, when export completes, then exported data contains scheduling/review state where the selected format supports it.
- ANKI-EXPORT-004: Given Include scheduling information is disabled, when export completes, then exported data omits scheduling/review state where the selected format supports omission.
- ANKI-EXPORT-005: Given Include media is enabled, when export completes, then referenced media files are included where the selected format supports media.
- ANKI-EXPORT-006: Given Include media is disabled, when export completes, then media files are omitted.
- ANKI-EXPORT-007: Given Include tags is enabled, when export completes, then note tags are present in the exported data where supported.
- ANKI-EXPORT-008: Given Include deck is enabled, when export completes, then deck assignment metadata is included where supported.
- ANKI-EXPORT-009: Given Include note type is enabled, when export completes, then note type/template metadata is included where supported.
- ANKI-EXPORT-010: Given Include GUID is enabled, when export completes, then note GUIDs are included where supported.
- ANKI-EXPORT-011: Given older-version support is enabled, when export completes, then the export uses compatibility behavior for older Anki versions where the format supports it.
- ANKI-EXPORT-012: Given the user selects Anki deck package format, when the dialog renders, then deck selector, include scheduling, include deck configs, include media, and older-version support controls are visible.
- ANKI-EXPORT-013: Given the user selects Anki collection package format, when the dialog renders, then include media and older-version support controls are visible and deck selector is hidden.
- ANKI-EXPORT-014: Given the user selects Notes in plain text format, when the dialog renders, then include HTML, tags, deck, note type, and GUID controls are visible.
- ANKI-EXPORT-015: Given the user selects Cards in plain text format, when the dialog renders, then include HTML is visible and note-only metadata controls are hidden.
- ANKI-EXPORT-016: Given Export is opened from a specific deck action, when the dialog renders, then that deck is selected by default and scheduling is unchecked by default.
- ANKI-EXPORT-017: Given Export is opened from selected Browser notes, when the dialog renders, then the scope displays selected notes rather than all decks.
- ANKI-EXPORT-018: Given the user chooses an export path inside the active profile base directory, when confirming export, then the app rejects that path and asks for a different location.
- ANKI-EXPORT-019: Given collection package export starts, when exporting is in progress, then the collection is temporarily closed and reopened after success or failure.
