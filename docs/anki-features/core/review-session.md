# Review Session

## Purpose

The review session is Anki's core spaced repetition loop. It presents a card question, reveals the answer, records a rating, and asks the scheduler for the next card.

## Review Flow

- Fetch the next queued card from the scheduler.
- Render the question side.
- Allow answer reveal through Show Answer.
- Render the answer side.
- Present answer buttons based on the card state:
  - Again and Good for two-button states.
  - Again, Good, and Easy for three-button states.
  - Again, Hard, Good, and Easy for four-button states.
- Build and record a scheduler answer from the selected rating.
- Advance to the next queued card or return to the deck overview.

## User Capabilities

- Show the answer.
- Rate recall quality with Again, Hard, Good, or Easy where applicable.
- Replay question or answer audio.
- Pause audio and seek backward or forward while reviewing.
- Type an answer when the card template requests typed input.
- Edit the current note.
- Open Card Info or Previous Card Info.
- Flag the current card.
- Mark or unmark the current note.
- Bury or suspend the current card or note.
- Forget the current card.
- Set the due date for the current card.
- Create a copy of the current note.
- Delete the current note.
- Record and replay the user's own voice for comparison.
- Toggle auto-advance for the active review session.
- Open deck options for the card's deck.

## Supporting Behavior

- Audio can autoplay and can replay question audio on the answer side depending on settings.
- The reviewer can show progress counts and next-review time estimates.
- Leech handling can tag or suspend difficult cards based on deck options.
- Time spent answering can be tracked and capped for scheduling/statistics.
- Auto-advance can show the answer or a reminder after a question-side delay.
- Auto-advance can bury, answer Again, answer Hard, answer Good, or show a reminder after an answer-side delay depending on deck options.
- Auto-advance can wait for audio to finish before acting.
- Keyboard shortcuts cover answer ratings, flagging, burying, suspending, and deletion.

## Review Surface

- The review web view renders a question/answer area plus hidden-but-addressable mark and flag controls.
- The bottom review bar exposes Edit, Show Answer or rating buttons, More, and the answer timer when enabled.
- The review body can carry a card-template-specific class so card styling can vary by card ordinal.
- The answer side is preloaded before reveal so answer rendering is ready when the user shows the answer.
- Flag and mark indicators update after the underlying card or note state changes.

## More Menu And Context Actions

The review More menu/context menu exposes card-scoped, note-scoped, audio, voice, scheduling, and metadata actions:

- Flag Card, with all supported flag colors and clear/no-flag state.
- Bury Card.
- Forget Card.
- Set Due Date.
- Suspend Card.
- Options.
- Card Info.
- Previous Card Info.
- Mark Note.
- Bury Note.
- Suspend Note.
- Create Copy.
- Delete Note.
- Replay Audio.
- Pause Audio.
- Audio -5s.
- Audio +5s.
- Record Own Voice.
- Replay Own Voice.
- Auto Advance toggle.

## Typed Answer Cards

- Typed answer prompts are requested by card templates using `[[type:FIELD]]`.
- Cloze typed prompts may target cloze text with `[[type:cloze:FIELD]]`.
- Typed answer matching can disable character combining with `[[type:nc:FIELD]]`.
- Unknown typed-answer fields render an error message on the card.
- Empty typed-answer fields remove the typed-answer placeholder instead of showing a broken input.
- On the answer side, Anki compares the supplied text with the expected field text and renders a comparison.

## Timebox And Review Exit

- A configured timebox can interrupt long review sessions.
- The timebox prompt lets the user continue reviewing or finish.
- Continuing starts a new timebox interval.
- Finishing leaves the active review flow and returns to the deck browser.

## Previous Card Tracking

- The reviewer tracks the previous reviewed card separately from the current card.
- Previous Card Info opens metadata for the last card the user reviewed, not the currently visible card.
- If there is no previous card, Previous Card Info is unavailable or produces no metadata dialog.

## Testable Criteria

- ANKI-REVIEW-001: Given a deck has at least one due card, when the review session starts, then the first screen shows the card question side and a Show Answer action.
- ANKI-REVIEW-002: Given the question side is visible, when the user activates Show Answer, then the answer side becomes visible and rating buttons are displayed.
- ANKI-REVIEW-003: Given the current card supports two answer buttons, when the answer side is visible, then the visible ratings are Again and Good.
- ANKI-REVIEW-004: Given the current card supports three answer buttons, when the answer side is visible, then the visible ratings are Again, Good, and Easy.
- ANKI-REVIEW-005: Given the current card supports four answer buttons, when the answer side is visible, then the visible ratings are Again, Hard, Good, and Easy.
- ANKI-REVIEW-006: Given the answer side is visible, when the user selects a rating, then the scheduler records that rating for the current card and the reviewer advances to the next queued card.
- ANKI-REVIEW-007: Given the user answers the last queued card, when the answer is recorded, then the app exits active review and returns to the deck overview or completion state.
- ANKI-REVIEW-008: Given a card template includes typed-answer input, when the user reveals the answer, then the typed response is compared with the expected answer and feedback is rendered.
- ANKI-REVIEW-009: Given the current card has playable audio on the current side, when the user activates replay audio, then the audio for that side is queued for playback.
- ANKI-REVIEW-010: Given a card is visible, when the user applies a flag color, then the current card's flag state changes to that color and the flag indicator updates.
- ANKI-REVIEW-011: Given a card is visible, when the user buries the current card, then the card leaves the current review queue until the bury period ends.
- ANKI-REVIEW-012: Given a card is visible, when the user buries the current note, then all sibling cards for that note are buried according to note-bury behavior.
- ANKI-REVIEW-013: Given a card is visible, when the user suspends the current card, then that card is removed from normal review queues until unsuspended.
- ANKI-REVIEW-014: Given a card is visible, when the user suspends the current note, then all cards for that note are removed from normal review queues until unsuspended.
- ANKI-REVIEW-015: Given a card is visible, when the user deletes the current note and confirms, then the note and its cards are removed from the collection.
- ANKI-REVIEW-016: Given deck options enable answer timer display, when a card is reviewed, then the reviewer displays elapsed answer time.
- ANKI-REVIEW-017: Given deck options limit tracked answer time, when an answer takes longer than the configured maximum, then scheduling/statistics ignore time beyond the configured maximum.
- ANKI-REVIEW-018: Given a card reaches the configured leech threshold, when the card is answered as a lapse, then the configured leech action is applied: suspend card or tag only.
- ANKI-REVIEW-019: Given question auto-advance is configured to show answer after S seconds, when the question side remains visible for S seconds, then the answer side is shown automatically.
- ANKI-REVIEW-020: Given question auto-advance is configured to show reminder after S seconds, when the question side remains visible for S seconds, then a reminder is shown instead of automatically revealing the answer.
- ANKI-REVIEW-021: Given answer auto-advance is configured to answer Good after S seconds, when the answer side remains visible for S seconds, then the Good rating is submitted automatically.
- ANKI-REVIEW-022: Given answer auto-advance is configured to answer Hard after S seconds, when the answer side remains visible for S seconds, then the Hard rating is submitted automatically if that rating is available.
- ANKI-REVIEW-023: Given answer auto-advance is configured to answer Again after S seconds, when the answer side remains visible for S seconds, then the Again rating is submitted automatically.
- ANKI-REVIEW-024: Given answer auto-advance is configured to bury card after S seconds, when the answer side remains visible for S seconds, then the current card is buried.
- ANKI-REVIEW-025: Given auto-advance wait-for-audio is enabled and audio is still playing, when the auto-advance delay expires, then the configured auto action waits until audio playback has ended.
- ANKI-REVIEW-026: Given stop timer on answer is enabled, when the user reveals the answer, then answer timing stops at reveal rather than continuing through rating selection.
- ANKI-REVIEW-027: Given a card is visible, when the user activates Edit, then an editor for the current note opens without leaving the review session.
- ANKI-REVIEW-028: Given a card is visible, when the user opens More, then review actions include flagging, burying, suspending, note actions, audio actions, voice actions, Card Info, Previous Card Info, Options, Set Due Date, Forget Card, Create Copy, Delete Note, and Auto Advance.
- ANKI-REVIEW-029: Given a card is visible and unmarked, when the user toggles Mark Note, then the note becomes marked and the review mark indicator updates.
- ANKI-REVIEW-030: Given a card is visible and marked, when the user toggles Mark Note, then the note becomes unmarked and the review mark indicator updates.
- ANKI-REVIEW-031: Given a card is visible, when the user opens Card Info, then a metadata/review-log dialog opens for the current card.
- ANKI-REVIEW-032: Given at least one card was previously reviewed in the same session, when the user opens Previous Card Info, then a metadata/review-log dialog opens for the previous card rather than the current card.
- ANKI-REVIEW-033: Given no card has previously been reviewed in the current session, when Previous Card Info is requested, then no previous-card metadata is shown.
- ANKI-REVIEW-034: Given a card is visible, when the user creates a copy, then the Add Notes flow opens with content copied from the current note.
- ANKI-REVIEW-035: Given a card is visible, when the user forgets the current card and confirms, then that card returns to the new-card queue.
- ANKI-REVIEW-036: Given a card is visible, when the user sets a due date and confirms a valid date or offset, then the card's due scheduling state changes accordingly.
- ANKI-REVIEW-037: Given a card has playable audio, when the user pauses audio, then currently playing review audio pauses.
- ANKI-REVIEW-038: Given a card has playable audio, when the user seeks audio backward five seconds, then playback position moves earlier by five seconds where possible.
- ANKI-REVIEW-039: Given a card has playable audio, when the user seeks audio forward five seconds, then playback position moves later by five seconds where possible.
- ANKI-REVIEW-040: Given the user records their own voice, when recording completes, then Replay Own Voice becomes able to play the recorded audio.
- ANKI-REVIEW-041: Given recorded voice audio exists for the current review session, when Replay Own Voice is activated, then the recorded voice audio plays.
- ANKI-REVIEW-042: Given auto-advance is available, when the user toggles Auto Advance from the More menu, then the active session's auto-advance enabled state changes and subsequent cards follow the new state.
- ANKI-REVIEW-043: Given a card template contains `[[type:FIELD]]` for an existing non-empty field, when the question renders, then a typed-answer input is shown for that field.
- ANKI-REVIEW-044: Given the user enters a typed answer, when the answer side is revealed, then the supplied text and expected field text are compared and comparison feedback is shown.
- ANKI-REVIEW-045: Given a card template contains `[[type:FIELD]]` for an unknown field, when the card renders, then an unknown-field error is shown instead of a typed-answer input.
- ANKI-REVIEW-046: Given a card template contains `[[type:FIELD]]` for an empty field, when the card renders, then the typed-answer placeholder is removed from the rendered card.
- ANKI-REVIEW-047: Given a card template contains `[[type:cloze:FIELD]]`, when the card renders for a cloze note, then typed-answer comparison uses the cloze text for the active cloze.
- ANKI-REVIEW-048: Given a timebox limit is configured and review time reaches the limit, when the timebox prompt appears, then the user can choose Continue or Finish.
- ANKI-REVIEW-049: Given the timebox prompt is visible, when the user chooses Continue, then reviewing continues and a new timebox interval starts.
- ANKI-REVIEW-050: Given the timebox prompt is visible, when the user chooses Finish, then the review session ends and the deck browser is shown.
