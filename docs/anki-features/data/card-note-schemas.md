# Card and Note Schemas

## Purpose

Cards and notes are Anki's core local collection records. Notes store user-authored field data and tags. Cards are generated review items that point at notes, decks, templates, and scheduler state.

## Note Record

A note has these app-level fields:

- Note ID.
- GUID.
- Note type ID.
- Modified time in seconds.
- Update sequence number.
- Tags.
- Ordered field values.
- Optional flags/data fields used internally by collection code.

Notes expose field access by field name and by field order. The set and order of fields comes from the note type. Notes also expose related cards and card IDs.

## Note Field And Tag Behavior

- Fields are stored as an ordered list matching the note type's field definitions.
- Field values can be joined into Anki's internal field separator format for persistence/export paths.
- Field lookup by name must resolve against the note type's field list.
- Tags are stored as normalized tag tokens and can be added, removed, joined into a tag string, and split back into tokens.
- Notes can be validated for missing required fields, duplicate field values, and cloze-specific problems.
- Cloze notes can report which cloze numbers appear in the field data.

## Card Record

A card has these app-level fields:

- Card ID.
- Note ID.
- Deck ID.
- Template ordinal.
- Modified time in seconds.
- Update sequence number.
- Card type.
- Queue.
- Due value.
- Interval.
- Ease factor.
- Review count.
- Lapse count.
- Remaining learning steps.
- Original due value.
- Original deck ID.
- User flag bits.
- Original position.
- Custom data.
- Scheduler memory state.
- Desired retention.
- Decay.
- Last review time.

## Card Type, Queue, And Due Semantics

- Card type `0` means new.
- Card type `1` means learning.
- Card type `2` means review.
- Queue `-3` means scheduler-buried.
- Queue `-2` means user-buried.
- Queue `-1` means suspended.
- Queue `0` means new.
- Queue `1` means learning.
- Queue `2` means review.
- Queue `3` means day-learning/relearning.
- Queue `4` means preview.
- For new cards, due stores the new-card position.
- For review cards, due stores an integer day.
- For learning cards, due stores a timestamp.

## Card Relationships

- Each card belongs to one note through note ID.
- Each card belongs to one deck through deck ID.
- Filtered or temporary movement can preserve an original deck ID and original due value.
- The effective current deck for display/scheduling is the original deck when present, otherwise the card deck.
- The template ordinal selects which card template on the note type generated the card.
- A card can load its note, note type, and template through the collection.

## Card Rendering And Timing

- Cards can render a question side.
- Cards can render an answer side.
- Cards can expose question-side and answer-side audio/video tags.
- Card templates can define time limits and timer display behavior.
- A card can start an answer timer.
- Time taken is reported from the timer and capped according to deck/review limits.
- Autoplay is available when the card, deck options, and media settings allow it.
- Answer-side replay of question audio depends on card/deck settings.

## Flags And Custom Data

- User flag color is stored in the low bits of the card flags value.
- Non-flag bits can coexist with user flag bits.
- Custom data is a card-scoped structured payload for scheduler or extension data.
- Scheduler memory state can store FSRS-like memory parameters, desired retention, decay, and last review time.

## Testable Criteria

- ANKI-SCHEMA-NOTE-001: Given a note exists, when it is loaded from the collection, then it exposes note ID, GUID, note type ID, modified time, update sequence number, tags, and ordered field values.
- ANKI-SCHEMA-NOTE-002: Given a note has a note type with named fields, when a field is read by name, then the value returned is the field value at the note type's matching field ordinal.
- ANKI-SCHEMA-NOTE-003: Given a note has a note type with named fields, when a field is updated by name, then the ordered field value at the matching ordinal changes.
- ANKI-SCHEMA-NOTE-004: Given a note field list is joined for persistence/export, when the joined value is produced, then field order is preserved.
- ANKI-SCHEMA-NOTE-005: Given a tag is added to a note, when the note is saved and reloaded, then the normalized tag token is present in the note's tag list.
- ANKI-SCHEMA-NOTE-006: Given a tag is removed from a note, when the note is saved and reloaded, then that tag token is absent from the note's tag list.
- ANKI-SCHEMA-NOTE-007: Given a note is validated and a required field is empty, when validation runs, then a missing-field validation result is produced.
- ANKI-SCHEMA-NOTE-008: Given duplicate checking is enabled for a note field and another note has the same duplicate value, when validation runs, then a duplicate-field validation result is produced.
- ANKI-SCHEMA-NOTE-009: Given a cloze note has cloze deletions in its fields, when cloze numbers are requested, then the note reports the cloze numbers present in field content.
- ANKI-SCHEMA-NOTE-010: Given a note has generated cards, when card IDs are requested from the note, then IDs for that note's cards are returned.
- ANKI-SCHEMA-CARD-001: Given a card exists, when it is loaded from the collection, then it exposes card ID, note ID, deck ID, template ordinal, modified time, update sequence number, card type, queue, due, interval, ease factor, review count, lapse count, remaining steps, original due, original deck, flags, original position, custom data, and scheduler memory fields.
- ANKI-SCHEMA-CARD-002: Given a card has card type `0`, when type is interpreted, then the card is treated as a new card.
- ANKI-SCHEMA-CARD-003: Given a card has card type `1`, when type is interpreted, then the card is treated as a learning card.
- ANKI-SCHEMA-CARD-004: Given a card has card type `2`, when type is interpreted, then the card is treated as a review card.
- ANKI-SCHEMA-CARD-005: Given a card has queue `-1`, when queue is interpreted, then the card is treated as suspended.
- ANKI-SCHEMA-CARD-006: Given a card has queue `-2`, when queue is interpreted, then the card is treated as user-buried.
- ANKI-SCHEMA-CARD-007: Given a card has queue `-3`, when queue is interpreted, then the card is treated as scheduler-buried.
- ANKI-SCHEMA-CARD-008: Given a card has queue `0`, when queue is interpreted, then the card is treated as queued as new.
- ANKI-SCHEMA-CARD-009: Given a card has queue `1`, when queue is interpreted, then the card is treated as queued as learning.
- ANKI-SCHEMA-CARD-010: Given a card has queue `2`, when queue is interpreted, then the card is treated as queued as review.
- ANKI-SCHEMA-CARD-011: Given a card has queue `3`, when queue is interpreted, then the card is treated as queued as day-learning or relearning.
- ANKI-SCHEMA-CARD-012: Given a card has queue `4`, when queue is interpreted, then the card is treated as a preview card.
- ANKI-SCHEMA-CARD-013: Given a new card has a due value, when due is interpreted, then the value is treated as the new-card position.
- ANKI-SCHEMA-CARD-014: Given a review card has a due value, when due is interpreted, then the value is treated as an integer review day.
- ANKI-SCHEMA-CARD-015: Given a learning card has a due value, when due is interpreted, then the value is treated as a timestamp.
- ANKI-SCHEMA-CARD-016: Given a card has an original deck ID, when the effective current deck is requested, then the original deck ID is used.
- ANKI-SCHEMA-CARD-017: Given a card has no original deck ID, when the effective current deck is requested, then the card's deck ID is used.
- ANKI-SCHEMA-CARD-018: Given a card has a template ordinal, when the card template is requested, then the note type template at that ordinal is returned.
- ANKI-SCHEMA-CARD-019: Given a card is rendered on the question side, when rendering completes, then the output is generated from the card's note, note type, template ordinal, and question template.
- ANKI-SCHEMA-CARD-020: Given a card is rendered on the answer side, when rendering completes, then the output is generated from the card's note, note type, template ordinal, and answer template.
- ANKI-SCHEMA-CARD-021: Given a card has question-side media references, when question audio/video tags are requested, then media tags for the question side are returned.
- ANKI-SCHEMA-CARD-022: Given a card has answer-side media references, when answer audio/video tags are requested, then media tags for the answer side are returned.
- ANKI-SCHEMA-CARD-023: Given a card answer timer has started, when time taken is requested, then elapsed time is returned subject to configured caps.
- ANKI-SCHEMA-CARD-024: Given a card has user flag bits set, when user flag is read, then only the low user-flag bits determine the visible flag color.
- ANKI-SCHEMA-CARD-025: Given a card has custom data, when the card is saved and reloaded, then custom data remains associated with that card.
- ANKI-SCHEMA-CARD-026: Given a card has scheduler memory state fields, when the card is saved and reloaded, then desired retention, decay, memory state, and last review time remain associated with that card.
- ANKI-SCHEMA-REL-001: Given a note has multiple generated cards, when one card is suspended, then the sibling cards still point to the same note and are not automatically removed.
- ANKI-SCHEMA-REL-002: Given a note is deleted, when collection deletion completes, then cards pointing to that note are deleted with it.
- ANKI-SCHEMA-REL-003: Given a card is moved to a different normal deck, when the card is saved and reloaded, then the card deck ID reflects the target deck.
- ANKI-SCHEMA-REL-004: Given a card is temporarily moved while preserving original deck data, when current deck is requested, then original deck state is considered according to filtered/temporary movement semantics.
