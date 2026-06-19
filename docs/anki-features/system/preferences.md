# Preferences

## Purpose

Preferences configure local app behavior across appearance, review, editing, browsing, backup, and network-related settings. Sync/account controls are excluded from this feature pass.

## Appearance

General:

- Language.
- Video driver.
- Check for updates.

User interface:

- Theme.
- Style.
- User interface size.
- Reset window sizes.

Distractions:

- Hide top bar during review.
- Hide bottom bar during review.
- Reduce motion.
- Minimalist mode.

## Review

Scheduler:

- Next day starts at.
- Learn-ahead limit.
- Timebox time limit.

Reviewer:

- Show play buttons on cards with audio.
- Interrupt current audio when answering.
- Show remaining card count.
- Show next review time above answer buttons.
- Spacebar rates card.
- Generate LaTeX images automatically.
- URL scheme controls.
- Answer key configuration.

## Editing

Editor:

- Paste clipboard images as PNG.
- Paste without shift strips formatting.
- Default deck behavior when adding.

Browsing:

- Default search text.
- Ignore accents in search.

## Backups

- Minutes between backups.
- Daily backups.
- Weekly backups.
- Monthly backups.
- Restore guidance from the backup folder.

## Excluded Preference Areas

The Network tab contains sync, account, media sync, timeout, and custom sync URL controls. Those are intentionally excluded for now because sync is out of scope. Third-party account preferences are also excluded.

## Testable Criteria

- ANKI-PREFS-001: Given Preferences opens, when it renders, then Appearance, Review, Editing, Network, Backups, and third-party tabs/sections may be present, but only non-sync criteria in this file are in scope.
- ANKI-PREFS-APPEARANCE-001: Given Appearance preferences are open, when the language selector is changed and saved, then the app stores the selected interface language preference.
- ANKI-PREFS-APPEARANCE-002: Given Appearance preferences are open, when video driver is changed and saved, then the app stores the selected video driver preference.
- ANKI-PREFS-APPEARANCE-003: Given Check for updates is toggled and saved, when preferences are reopened, then the toggle reflects the saved value.
- ANKI-PREFS-APPEARANCE-004: Given theme is changed and saved, when the app UI refreshes or restarts as required, then the selected theme is applied.
- ANKI-PREFS-APPEARANCE-005: Given style is changed and saved, when the app UI refreshes or restarts as required, then the selected style is applied.
- ANKI-PREFS-APPEARANCE-006: Given UI size is changed and saved, when the app UI refreshes or restarts as required, then interface scale reflects the saved percentage.
- ANKI-PREFS-APPEARANCE-007: Given Reset window sizes is activated, when the user reopens app windows, then they use default saved sizes rather than previous custom sizes.
- ANKI-PREFS-APPEARANCE-008: Given hide top bar during review is enabled, when a review session opens, then the top bar is hidden according to the selected mode.
- ANKI-PREFS-APPEARANCE-009: Given hide bottom bar during review is enabled, when a review session opens, then the bottom bar is hidden according to the selected mode.
- ANKI-PREFS-APPEARANCE-010: Given reduce motion is enabled, when UI transitions that normally animate occur, then reduced-motion behavior is used.
- ANKI-PREFS-APPEARANCE-011: Given minimalist mode is enabled, when supported review surfaces render, then nonessential UI elements are reduced according to minimalist mode.
- ANKI-PREFS-REVIEW-001: Given next day starts at is set to H and saved, when scheduler day rollover is evaluated, then the Anki day changes at H hours past midnight.
- ANKI-PREFS-REVIEW-002: Given learn-ahead limit is set to M minutes and saved, when learning cards are due within M minutes, then they may be shown ahead of schedule.
- ANKI-PREFS-REVIEW-003: Given timebox time limit is set to M minutes and saved, when a review session exceeds M minutes, then the app can show timebox progress/completion feedback.
- ANKI-PREFS-REVIEW-004: Given show play buttons is enabled, when a card with audio renders, then play buttons are visible.
- ANKI-PREFS-REVIEW-005: Given interrupt current audio when answering is enabled, when the user answers while audio is playing, then current audio stops or is interrupted.
- ANKI-PREFS-REVIEW-006: Given show remaining card count is enabled, when reviewing, then remaining count information is visible.
- ANKI-PREFS-REVIEW-007: Given show next review time is enabled, when answer buttons render, then next-review time estimates are displayed above or with the answer buttons.
- ANKI-PREFS-REVIEW-008: Given spacebar-rates-card is enabled, when the answer side is visible and the user presses space, then the default answer rating is submitted.
- ANKI-PREFS-REVIEW-009: Given spacebar-rates-card is disabled, when the answer side is visible and the user presses space, then no rating is submitted solely from the spacebar action.
- ANKI-PREFS-REVIEW-010: Given automatic LaTeX image generation is enabled, when note content contains LaTeX requiring generated images, then the app generates required LaTeX images.
- ANKI-PREFS-REVIEW-011: Given answer keys are configured, when reviewing and pressing a configured answer key, then the corresponding rating is submitted.
- ANKI-PREFS-EDITING-001: Given paste images as PNG is enabled, when an image is pasted into an editor field, then the pasted media is stored as PNG.
- ANKI-PREFS-EDITING-002: Given paste without shift strips formatting is enabled, when formatted text is pasted without shift into an editor field, then formatting is stripped according to the preference.
- ANKI-PREFS-EDITING-003: Given default deck behavior is set to current deck, when Add opens, then the Add dialog defaults to the current deck.
- ANKI-PREFS-EDITING-004: Given default deck behavior is set to change deck depending on note type, when Add opens for a note type with an associated deck, then the Add dialog selects that associated deck.
- ANKI-PREFS-EDITING-005: Given default search text is set and saved, when Browser opens, then the search field starts with that default search text.
- ANKI-PREFS-EDITING-006: Given ignore accents in search is enabled, when Browser search text omits accents, then matching accented field text is returned.
- ANKI-PREFS-BACKUPS-001: Given backup retention preferences are changed and saved, when Preferences is reopened, then minutes, daily, weekly, and monthly backup values match the saved values.
- ANKI-PREFS-SCOPE-001: Given the Network tab is visible, when documenting/testing this feature set, then sync, account login/logout, media sync, custom sync URL, and network timeout behaviors are excluded.
- ANKI-PREFS-SCOPE-002: Given third-party account sections are visible, when documenting/testing this feature set, then those account behaviors are excluded.
