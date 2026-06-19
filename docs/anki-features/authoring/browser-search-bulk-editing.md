# Browser, Search, and Bulk Editing

## Purpose

The Browser is Anki's card and note management workspace. It combines search, filtering, table-based selection, note editing, and bulk operations.

## Primary Surface

- Search box with history.
- Sidebar for browsing/filtering collections.
- Card/note result table with sortable columns.
- Editor panel for the selected note.
- Menus for Edit, View, Notes, Cards, Go, and Help.
- Optional preview window for the selected card.
- Optional Card Info window for card metadata and review history.

## Search And Navigation

- Find and search within the card list.
- Filter via sidebar.
- Search inside formatting when Browser options enable full formatting search.
- Toggle between card and note display modes.
- Navigate first, previous, next, and last card.
- Toggle card list and sidebar visibility.
- Change layout between automatic, vertical, and horizontal modes.
- Open a preview window for the selected card.
- Open card information for the selected/current card.

## Browser Menus

Edit menu:

- Undo.
- Redo.
- Invert Selection.
- Select Notes.
- Close.
- Create Filtered Deck.

View menu:

- Full Screen.
- Zoom In, Zoom Out, and Reset Zoom for Browser/editor display.
- Layout: Auto, Vertical, and Horizontal.
- Toggle Sidebar.

Notes menu:

- Add.
- Copy or Create Copy.
- Add Tags.
- Remove Tags.
- Clear Unused Tags.
- Toggle Mark.
- Change Note Type.
- Find Duplicates.
- Find and Replace.
- Manage Note Types.
- Delete.
- Export Notes.

Cards menu:

- Change Deck.
- Info.
- Reposition.
- Set Due Date.
- Grade Now.
- Forget.
- Toggle Suspend.
- Toggle Bury.
- Flag submenu.

Go menu:

- Find/search focus.
- Filter/sidebar-search focus.
- Sidebar focus.
- Note/editor focus.
- Card List focus.
- First Card.
- Previous Card.
- Next Card.
- Last Card.

## Selection

- Select all.
- Select all cards belonging to selected notes.
- Invert selection.
- Create a filtered deck from the current search or selection.
- Preserve a current row when refreshing search results where possible.
- Update dependent panels when the current card or note changes.

## Note Operations

- Add notes.
- Create a copy of a note.
- Export notes.
- Add or remove tags.
- Clear unused tags.
- Toggle marked state.
- Change note type.
- Find duplicates.
- Find and replace.
- Run find/replace against all fields, tags, or a specific field.
- Run find/replace against selected notes only or all notes.
- Use regex and case-insensitive matching in find/replace.
- Manage note types.
- Delete selected notes.
- Add opens the Add Notes dialog using the selected deck and, when possible, the selected note's note type as context.

## Card Operations

- Change deck.
- Set due date.
- Grade now.
- Forget, returning selected cards to a new-card state.
- Reposition new cards.
- Toggle suspend.
- Toggle bury.
- Apply colored flags.
- Open card information.

## Behavior

Browser actions can operate on selected cards, selected notes, or both depending on the command. Many operations are bulk-edit commands and should be treated as undoable collection changes.

The Browser saves pending editor changes before destructive or cross-selection actions that require a clean current note. Closing the Browser cleans up the editor, table, sidebar, preview, and Card Info windows.

Auto layout chooses vertical or horizontal split orientation based on the Browser window aspect ratio. Manual vertical and horizontal layout selections override that automatic choice.

Undo and Redo are available from Browser menus and apply to undoable collection changes made from the Browser.

## Sidebar

- The sidebar is a docked tree with a search field and toolbar.
- Sidebar filtering narrows visible tree nodes.
- Sidebar activation runs the associated Browser search or filter.
- Sidebar focus and sidebar-search focus are addressable from the Go menu.
- The sidebar can be hidden without closing the Browser.
- The sidebar can be shown again with its previous filtering behavior intact.

## Preview

- Preview is a separate Browser-owned window.
- Preview renders the selected card using the same card rendering path as reviewing.
- Preview updates when the current card changes.
- Closing the Browser closes its preview window.

## Browser Options

Browser options control table display:

- Browser font.
- Browser font size.
- Browser row/line size.
- Whether search should include formatting markup, which is slower.

## Duplicate Search

Find Duplicates asks for a field and an optional search constraint. Results are grouped by duplicate field value. Each group links back into the Browser search for the duplicate note IDs. A Tag Duplicates action applies Anki's duplicate tag to all notes in the current duplicate report.

## Card Info

Card Info displays metadata and review log information for the current card. It can be copied as structured JSON via the copy shortcut.

## Close And Cleanup

- Closing the Browser saves the current editor note when possible.
- Closing the Browser closes or invalidates Browser-owned preview and Card Info windows.
- Closing the Browser releases table, sidebar, editor, and preview references so later Browser windows start with fresh UI state.

## Testable Criteria

- ANKI-BROWSER-001: Given the Browser opens, when it renders, then it shows a search input, result table, and editor panel.
- ANKI-BROWSER-002: Given the collection contains cards matching a search query, when the user submits that query, then the result table shows matching cards or notes according to the current display mode.
- ANKI-BROWSER-003: Given a search has results, when the user selects a row, then the editor panel displays the selected note's fields.
- ANKI-BROWSER-004: Given the user edits a field in the editor panel, when the edit is saved/applied, then the note's stored field value changes and the table refreshes if that field is visible.
- ANKI-BROWSER-005: Given card mode is active, when the user toggles to note mode, then result rows represent notes instead of individual cards.
- ANKI-BROWSER-006: Given note mode is active, when the user toggles to card mode, then result rows represent individual cards.
- ANKI-BROWSER-007: Given multiple rows are visible, when the user activates Select All, then all visible result rows are selected.
- ANKI-BROWSER-008: Given a subset of rows is selected, when the user activates Invert Selection, then selected rows become unselected and previously unselected visible rows become selected.
- ANKI-BROWSER-009: Given selected cards belong to notes with sibling cards, when the user activates Select Notes, then all rows belonging to those notes are selected.
- ANKI-BROWSER-010: Given one or more notes are selected, when the user adds tags and confirms a tag value, then each selected note contains that tag.
- ANKI-BROWSER-011: Given one or more notes contain a tag, when the user removes that tag from selected notes, then the tag is absent from each selected note.
- ANKI-BROWSER-012: Given notes have unused tags in the collection, when the user activates Clear Unused Tags, then tags not assigned to any note are removed from the tag list.
- ANKI-BROWSER-013: Given selected notes are unmarked, when the user toggles marked state, then each selected note receives the marked tag/state.
- ANKI-BROWSER-014: Given selected notes are marked, when the user toggles marked state, then each selected note loses the marked tag/state.
- ANKI-BROWSER-015: Given selected cards exist, when the user changes deck and confirms a target deck, then each selected card's deck is updated to the target deck.
- ANKI-BROWSER-016: Given selected cards exist, when the user sets a due date, then each selected card receives the requested due scheduling state.
- ANKI-BROWSER-017: Given selected review cards exist, when the user activates Forget, then selected cards return to the new-card queue.
- ANKI-BROWSER-018: Given selected new cards exist, when the user repositions them and confirms a position, then their new-card order changes accordingly.
- ANKI-BROWSER-019: Given selected cards are unsuspended, when the user toggles suspend, then selected cards become suspended.
- ANKI-BROWSER-020: Given selected cards are suspended, when the user toggles suspend, then selected cards become unsuspended.
- ANKI-BROWSER-021: Given selected cards are unburied, when the user toggles bury, then selected cards become buried for the appropriate bury window.
- ANKI-BROWSER-022: Given selected cards exist, when the user applies a flag color, then each selected card's flag becomes that color.
- ANKI-BROWSER-023: Given selected notes exist, when the user changes note type and confirms field mapping, then selected notes use the new note type with mapped field values.
- ANKI-BROWSER-024: Given duplicate field values exist, when the user opens Find Duplicates for that field, then the dialog/report lists duplicate note groups.
- ANKI-BROWSER-025: Given selected notes contain text matching a find value, when the user runs Find and Replace, then matching text is replaced according to the command options.
- ANKI-BROWSER-026: Given selected notes exist, when the user exports notes, then the export workflow opens with the selected notes as the export scope.
- ANKI-BROWSER-027: Given a search result set exists, when the user creates a filtered deck from the Browser, then the filtered-deck workflow opens using the current search/selection context.
- ANKI-BROWSER-028: Given the user selects vertical layout, when the Browser renders, then the result table and editor are arranged vertically.
- ANKI-BROWSER-029: Given the user selects horizontal layout, when the Browser renders, then the result table and editor are arranged horizontally.
- ANKI-BROWSER-030: Given the user toggles sidebar visibility off, when the Browser renders, then the sidebar dock is hidden and table/editor remain usable.
- ANKI-BROWSER-031: Given the user toggles sidebar visibility on, when the Browser renders, then the sidebar dock is visible and contains a sidebar search box.
- ANKI-BROWSER-032: Given the user filters the sidebar, when matching sidebar nodes exist, then sidebar results update to matching items.
- ANKI-BROWSER-033: Given exactly one card row is selected, when Preview is activated, then a preview window opens for that selected card.
- ANKI-BROWSER-034: Given the preview window is open and the selected card changes, when the Browser selection updates, then the preview renders the newly selected card.
- ANKI-BROWSER-035: Given Card Info is opened for a selected card, when it renders, then it shows card metadata and review-log information for that card.
- ANKI-BROWSER-036: Given Card Info is focused, when the user copies, then structured card info is written to the clipboard.
- ANKI-BROWSER-037: Given Browser Options opens, when font, font size, or line size is changed and confirmed, then the result table uses the new display settings.
- ANKI-BROWSER-038: Given Browser Options has search-within-formatting enabled, when the user searches for text that appears only in formatting markup, then matching notes/cards are returned.
- ANKI-BROWSER-039: Given the Browser is open and a collection change has been made from the Browser, when Undo is activated from the Browser Edit menu, then the most recent undoable Browser collection change is reverted.
- ANKI-BROWSER-040: Given an undoable Browser collection change has been undone, when Redo is activated from the Browser Edit menu, then the undone change is reapplied.
- ANKI-BROWSER-041: Given the Browser is open, when Close is activated from the Browser Edit menu, then the Browser closes after attempting to save the current editor note.
- ANKI-BROWSER-042: Given the Browser is open, when Full Screen is activated from the View menu, then the Browser window enters or exits full-screen mode according to the platform window behavior.
- ANKI-BROWSER-043: Given the Browser editor/table is visible, when Zoom In is activated, then Browser display zoom increases.
- ANKI-BROWSER-044: Given the Browser editor/table is visible, when Zoom Out is activated, then Browser display zoom decreases.
- ANKI-BROWSER-045: Given Browser display zoom was changed, when Reset Zoom is activated, then Browser display zoom returns to its default level.
- ANKI-BROWSER-046: Given auto layout is selected and the Browser window is wider than it is tall, when layout is recalculated, then the table/editor split uses horizontal orientation.
- ANKI-BROWSER-047: Given auto layout is selected and the Browser window is taller than it is wide, when layout is recalculated, then the table/editor split uses vertical orientation.
- ANKI-BROWSER-048: Given the Browser is open, when Add is activated from the Notes menu, then the Add Notes dialog opens.
- ANKI-BROWSER-049: Given a current row is selected, when Add is activated from the Browser, then the Add Notes dialog uses the selected note's note type where possible.
- ANKI-BROWSER-050: Given a current card has a deck context, when Add is activated from the Browser, then the Add Notes dialog uses that deck where possible.
- ANKI-BROWSER-051: Given selected notes exist, when Create Copy is activated from the Notes menu, then the Add Notes dialog opens with copied note content.
- ANKI-BROWSER-052: Given selected notes exist, when Delete is activated from the Notes menu and confirmed, then selected notes and their cards are removed from the collection.
- ANKI-BROWSER-053: Given selected cards exist, when Grade Now is activated, then selected cards receive immediate grading according to the command's chosen rating behavior.
- ANKI-BROWSER-054: Given selected cards exist, when a flag color is chosen from the Cards flag submenu, then all selected cards receive that flag color.
- ANKI-BROWSER-055: Given selected cards have a flag, when the no-flag/clear flag command is chosen, then selected cards no longer have a user flag color.
- ANKI-BROWSER-056: Given the search box is not focused, when Find/Search focus is activated from the Go menu, then keyboard focus moves to the Browser search box.
- ANKI-BROWSER-057: Given the sidebar search box is not focused, when Filter focus is activated from the Go menu, then keyboard focus moves to the sidebar search box.
- ANKI-BROWSER-058: Given the sidebar is visible, when Sidebar focus is activated from the Go menu, then keyboard focus moves to the sidebar tree.
- ANKI-BROWSER-059: Given the editor is visible, when Note focus is activated from the Go menu, then keyboard focus moves to the note editor.
- ANKI-BROWSER-060: Given the result table is visible, when Card List focus is activated from the Go menu, then keyboard focus moves to the result table.
- ANKI-BROWSER-061: Given search results contain multiple rows, when First Card is activated, then the first result row becomes current.
- ANKI-BROWSER-062: Given search results contain multiple rows and a non-first row is current, when Previous Card is activated, then the previous result row becomes current.
- ANKI-BROWSER-063: Given search results contain multiple rows and a non-last row is current, when Next Card is activated, then the next result row becomes current.
- ANKI-BROWSER-064: Given search results contain multiple rows, when Last Card is activated, then the last result row becomes current.
- ANKI-BROWSER-065: Given the preview window is open, when the Browser closes, then the Browser-owned preview window closes or is invalidated.
- ANKI-BROWSER-066: Given Card Info is open from the Browser, when the Browser closes, then the Browser-owned Card Info window closes or is invalidated.
- ANKI-BROWSER-067: Given there are unsaved editor changes, when a Browser operation requires leaving the current note, then the Browser attempts to save the note before completing the operation.
- ANKI-BROWSER-068: Given the sidebar is hidden, when a sidebar-focus command is activated, then the Browser shows or focuses the sidebar according to the command's behavior.
- ANKI-FIND-REPLACE-001: Given Find and Replace opens with selected notes, when Selected notes is checked and the operation runs, then only selected notes are updated.
- ANKI-FIND-REPLACE-002: Given Find and Replace opens, when Selected notes is unchecked and the operation runs, then all matching notes in the collection scope are eligible for update.
- ANKI-FIND-REPLACE-003: Given a specific field is selected, when Find and Replace runs, then only that field is modified.
- ANKI-FIND-REPLACE-004: Given Tags is selected as the field, when Find and Replace runs, then matching tags are renamed/replaced rather than field text.
- ANKI-FIND-REPLACE-005: Given regex is enabled, when the find value is a valid regex, then matches are computed using regex semantics.
- ANKI-FIND-REPLACE-006: Given ignore case is enabled, when field text differs only by letter case, then it is matched and replaced.
- ANKI-DUPES-001: Given Find Duplicates opens, when it renders, then a field selector and search constraint input are visible.
- ANKI-DUPES-002: Given duplicate values exist for the selected field and search constraint, when Search is activated, then duplicate groups are listed with note counts.
- ANKI-DUPES-003: Given duplicate groups are displayed, when a group link is activated, then Browser searches for the note IDs in that duplicate group and switches to note view.
- ANKI-DUPES-004: Given duplicate groups are displayed, when Tag Duplicates is activated, then every note in the duplicate report receives the duplicate tag.
