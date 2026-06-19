# Deck Options And Scheduling

## Purpose

Deck options control how cards enter learning, review, lapse recovery, and general review behavior for a deck or option group.

## Option Groups

Decks use an options group. The user can select a group and manage it, allowing multiple decks to share scheduling settings.

Modern Anki also supports deck-specific daily limits and selected global scheduler behaviors, including FSRS. The current deck can have limits that override or combine with parent limits.

## New Cards

Controls:

- Learning steps in minutes.
- New cards per day.
- Minimum new cards per day.
- New card gather priority.
- New card sort order.
- New card insertion order.
- New/review mix.
- New card order.
- Graduating interval.
- Easy interval.
- Starting ease.
- Whether to bury related new cards until the next day.

## Reviews

Controls:

- Maximum reviews per day.
- Review order.
- Interday learning/review mix.
- Easy bonus.
- Hard multiplier/hard interval behavior.
- Interval modifier.
- Maximum interval.
- Whether to bury related reviews until the next day.
- Whether to bury interday learning siblings.

## Lapses

Controls:

- Relearning steps in minutes.
- New interval percentage.
- Minimum interval.
- Leech threshold.
- Leech action: suspend card or tag only.

## General

Controls:

- Ignore answer times longer than a configured number of seconds.
- Show answer timer.
- Automatically play audio.
- Always include question-side audio when replaying.
- Stop timer on answer.
- Auto-show-answer or reminder behavior for the question side.
- Auto-answer/bury/reminder behavior for the answer side.
- Wait for audio before auto-advance.

## FSRS

FSRS-related controls and stored values include:

- FSRS enable/disable.
- Desired retention.
- Historical retention.
- FSRS parameter sets.
- Parameter search.
- Ignore review logs before a configured date.
- FSRS reschedule behavior.
- FSRS health check.
- Days since last FSRS optimize.
- Card state customizer.

## Ordering Details

New card gather priority options include deck order, deck then random notes, lowest position, highest position, random notes, and random cards.

New card sort order options include template order, no sort, template then random, random note then template, and random card.

Review order options include due date, due date then deck, deck then due date, interval ascending/descending, ease ascending/descending, retrievability ascending/descending, random, added, and reverse added.

Mix controls determine whether new or interday learning cards are mixed with reviews, shown after reviews, or shown before reviews.

## Behavior

These settings feed the scheduler and affect future intervals, daily limits, sibling burying, leech handling, audio behavior, and review-time tracking. Changes can affect every deck using the same options group.

## Testable Criteria

- ANKI-DECK-OPTIONS-001: Given deck options opens for a deck, when it renders, then the active options group selector is visible.
- ANKI-DECK-OPTIONS-002: Given multiple options groups exist, when the user selects a different options group, then the dialog displays settings from that group.
- ANKI-DECK-OPTIONS-003: Given a setting is changed and saved in an options group, when another deck using the same group opens options, then the changed setting is visible there.
- ANKI-DECK-OPTIONS-004: Given the user changes learning steps and saves, when new cards from that deck enter learning, then their learning steps follow the configured minute sequence.
- ANKI-DECK-OPTIONS-005: Given the user changes new-card order and saves, when new cards are introduced, then introduction order follows the configured order.
- ANKI-DECK-OPTIONS-006: Given new cards per day is set to N, when the deck has more than N unseen new cards, then at most N new cards are introduced that day for that deck/options constraints.
- ANKI-DECK-OPTIONS-007: Given graduating interval is set to D days, when a learning card graduates with Good, then its next review interval uses D days subject to scheduler rules.
- ANKI-DECK-OPTIONS-008: Given easy interval is set to D days, when a learning card graduates with Easy, then its next review interval uses D days subject to scheduler rules.
- ANKI-DECK-OPTIONS-009: Given starting ease is set to P percent, when a new card graduates, then the card's initial ease factor uses P percent.
- ANKI-DECK-OPTIONS-010: Given bury related new cards is enabled, when one sibling new card is studied, then related new siblings are hidden until the next day.
- ANKI-DECK-OPTIONS-011: Given maximum reviews per day is set to N, when more than N reviews are due, then the deck introduces no more than N review cards that day for that deck/options constraints.
- ANKI-DECK-OPTIONS-012: Given easy bonus is changed and saved, when a review card is answered Easy, then the scheduler uses the configured easy bonus in the resulting interval calculation.
- ANKI-DECK-OPTIONS-013: Given interval modifier is changed and saved, when a review card is answered, then the scheduler applies the configured modifier to eligible review intervals.
- ANKI-DECK-OPTIONS-014: Given maximum interval is set to D days, when a review answer would schedule beyond D, then the resulting interval is capped at D days.
- ANKI-DECK-OPTIONS-015: Given hard interval is changed and saved, when a review card is answered Hard, then the scheduler uses the configured hard interval behavior.
- ANKI-DECK-OPTIONS-016: Given bury related reviews is enabled, when one sibling review card is studied, then related review siblings are hidden until the next day.
- ANKI-DECK-OPTIONS-017: Given lapse relearning steps are configured, when a review card lapses, then it enters relearning using the configured lapse steps.
- ANKI-DECK-OPTIONS-018: Given new interval percentage is set for lapses, when a lapsed card returns to review, then its interval is derived from the configured percentage subject to scheduler rules.
- ANKI-DECK-OPTIONS-019: Given minimum interval is set for lapses, when a lapsed card returns to review, then its interval is not below the configured minimum.
- ANKI-DECK-OPTIONS-020: Given leech threshold is set to N and leech action is suspend, when a card reaches N lapses, then the card becomes suspended.
- ANKI-DECK-OPTIONS-021: Given leech threshold is set to N and leech action is tag only, when a card reaches N lapses, then the card is tagged as a leech and remains unsuspended.
- ANKI-DECK-OPTIONS-022: Given show answer timer is enabled, when reviewing a card from the deck, then the review screen displays an answer timer.
- ANKI-DECK-OPTIONS-023: Given autoplay audio is enabled and a card has audio, when the card side renders, then its audio begins playback automatically.
- ANKI-DECK-OPTIONS-024: Given replay question side with answer audio is enabled, when replaying audio on the answer side, then question-side audio is included.
- ANKI-DECK-OPTIONS-025: Given new-card gather priority is set to deck order, when new cards are gathered, then decks are considered in alphabetical/preorder deck order before card position.
- ANKI-DECK-OPTIONS-026: Given new-card gather priority is set to random cards, when new cards are gathered, then sibling grouping is not preserved by gather order.
- ANKI-DECK-OPTIONS-027: Given new-card sort order is set to template order, when gathered new cards are sorted, then lower template ordinals appear before higher template ordinals.
- ANKI-DECK-OPTIONS-028: Given new-card sort order is set to random card, when gathered new cards are sorted, then new card order is randomized at the card level.
- ANKI-DECK-OPTIONS-029: Given new-card insertion order is set to due, when new cards are added, then they are inserted using due-order behavior.
- ANKI-DECK-OPTIONS-030: Given new-card insertion order is set to random, when new cards are added, then their initial new-card position is randomized.
- ANKI-DECK-OPTIONS-031: Given new/review mix is set to before reviews, when both new and review cards are due, then new cards are shown before review cards subject to limits.
- ANKI-DECK-OPTIONS-032: Given new/review mix is set to after reviews, when both new and review cards are due, then review cards are shown before new cards subject to limits.
- ANKI-DECK-OPTIONS-033: Given review order is set to retrievability ascending, when review cards are queued under FSRS, then lower retrievability cards appear before higher retrievability cards subject to queue constraints.
- ANKI-DECK-OPTIONS-034: Given interday learning mix is set to before reviews, when interday learning and review cards are due, then interday learning cards are shown before reviews subject to limits.
- ANKI-DECK-OPTIONS-035: Given bury interday learning is enabled, when one sibling interday learning card is shown, then related sibling interday learning cards are buried until the next day.
- ANKI-DECK-OPTIONS-036: Given a current deck daily new limit override is set to N, when the deck is studied, then the current deck introduces no more than N new cards that day even if the preset limit is higher.
- ANKI-DECK-OPTIONS-037: Given a current deck daily review limit override is set to N, when the deck is studied, then the current deck introduces no more than N reviews that day even if the preset limit is higher.
- ANKI-DECK-OPTIONS-038: Given parent limits apply, when studying a child deck, then child deck availability is constrained by active parent deck limits.
- ANKI-DECK-OPTIONS-039: Given FSRS is enabled, when review intervals are calculated, then FSRS scheduling fields and parameters are used instead of legacy interval-only scheduling where applicable.
- ANKI-DECK-OPTIONS-040: Given desired retention is changed and saved, when FSRS schedules future reviews, then the configured desired retention is used in interval calculation.
- ANKI-DECK-OPTIONS-041: Given FSRS parameters are changed or optimized and saved, when FSRS schedules future reviews, then the saved parameter set is used.
- ANKI-DECK-OPTIONS-042: Given ignore-revlogs-before date is set, when FSRS evaluation/optimization reads review history, then revlogs before that date are excluded.
- ANKI-DECK-OPTIONS-043: Given FSRS reschedule is enabled during relevant update flow, when deck config changes are applied, then existing cards may be rescheduled according to FSRS behavior.
- ANKI-DECK-OPTIONS-044: Given card state customizer code is saved, when a card is reviewed, then the reviewer can evaluate that customizer during scheduling state preparation.
- ANKI-DECK-OPTIONS-045: Given question auto action and seconds-to-show-question are configured, when reviewing, then those settings control question-side auto-advance.
- ANKI-DECK-OPTIONS-046: Given answer auto action and seconds-to-show-answer are configured, when reviewing, then those settings control answer-side auto-advance.
- ANKI-DECK-OPTIONS-047: Given wait-for-audio is enabled, when auto-advance is due while audio is playing, then auto-advance waits for audio completion.
