# Add Notes

## Purpose

The Add dialog lets users create new notes that generate one or more cards through a selected note type and target deck.

## Primary Surface

- Note type selector.
- Deck selector.
- Dynamic field editor area based on the selected note type.
- Add/close controls.
- History control for recently added notes.
- Edit menu for editor actions.

## User Capabilities

- Choose the note type before entering content.
- Choose the target deck before adding.
- Fill note fields such as Front, Back, Extra, or custom fields.
- Insert formatted text, media, and other editor-supported content.
- Toggle sticky fields so values carry over to the next added note.
- Add cloze deletions when using a cloze-capable note type.
- Add image occlusion notes when using an image-occlusion note type.
- Open Fields or Cards/template editing from the editor toolbar.
- Open recently added notes from Add History in the Browser.
- Add one note and continue authoring more notes.

## Behavior

Fields are generated from the active note type. Adding a note creates card records according to that note type's card templates. The default deck behavior can be configured in Preferences.

When the note type changes, Anki attempts to carry compatible nonempty field values into the new note type. Fields with identical names are copied first, then remaining nonempty old field values are copied into remaining new fields in order. Tags are carried over.

After a successful add, Anki records the note in Add History, clears non-sticky fields, preserves sticky fields and tags, and keeps the dialog ready for another note.

## Editor Tools

The embedded note editor supports:

- Bold, italic, underline, superscript, and subscript.
- Clear formatting.
- Foreground/text color and highlight color.
- Cloze insertion.
- Media attachment from file.
- Audio recording.
- Paste, cut, and copy integration.
- HTML editing.
- MathJax inline, MathJax block, MathJax chemistry, LaTeX, LaTeX equation, and LaTeX math environment insertion.
- Image occlusion image selection from file or clipboard.
- Duplicate lookup for first-field duplicate warnings.
- Tags editing and tag collapse state.
- Field collapse state and sticky-field toggles.

## Testable Criteria

- ANKI-ADD-NOTES-001: Given the Add dialog is opened, when it renders, then a note type selector and deck selector are visible before the field editor.
- ANKI-ADD-NOTES-002: Given the selected note type has fields, when the Add dialog renders, then one editable field control is shown for each field in note-type order.
- ANKI-ADD-NOTES-003: Given the user changes the selected note type, when the selection is applied, then the field editor updates to the fields for the newly selected note type.
- ANKI-ADD-NOTES-004: Given the user changes the selected deck, when a note is added, then generated cards are assigned to the selected deck unless the note type explicitly routes cards elsewhere.
- ANKI-ADD-NOTES-005: Given required note fields contain valid values, when the user activates Add, then a new note is created and cards are generated from that note type's card templates.
- ANKI-ADD-NOTES-006: Given the note fields would generate no cards, when the user activates Add, then the app prevents or warns about adding an unusable note/card set.
- ANKI-ADD-NOTES-007: Given a field contains formatted text, when the note is added, then the field content is preserved according to editor formatting rules.
- ANKI-ADD-NOTES-008: Given a field contains media inserted through the editor, when the note is added, then the media reference is stored with the note content and available to rendered cards.
- ANKI-ADD-NOTES-009: Given a note is successfully added, when the Add dialog remains open, then the user can add another note without reopening the dialog.
- ANKI-ADD-NOTES-010: Given Preferences default deck behavior is set to use the current deck, when the Add dialog opens, then the deck selector defaults to the current deck.
- ANKI-ADD-NOTES-011: Given the user changes note type while fields contain values, when the new note type has fields with matching names, then matching field values are copied into those fields.
- ANKI-ADD-NOTES-012: Given the user changes note type while fields contain values and no matching field names remain, when the new note type has empty fields, then remaining nonempty values are copied in field order until no destination fields remain.
- ANKI-ADD-NOTES-013: Given the current note has tags and the user changes note type, when the new note is loaded, then tags are preserved.
- ANKI-ADD-NOTES-014: Given a field is marked sticky and contains a value, when a note is successfully added, then the next blank note retains that field value.
- ANKI-ADD-NOTES-015: Given a field is not sticky and contains a value, when a note is successfully added, then the next blank note clears that field value.
- ANKI-ADD-NOTES-016: Given a note is successfully added, when the user opens Add History, then the note appears as an editable history entry unless it has been deleted.
- ANKI-ADD-NOTES-017: Given an Add History entry points to an existing note, when the user selects it, then the Browser opens focused on that note.
- ANKI-ADD-NOTES-018: Given an Add History entry points to a deleted note, when Add History opens, then the entry is disabled and labeled as deleted.
- ANKI-EDITOR-001: Given text is selected in a field, when Bold is activated, then the selected text is marked bold in stored field HTML/content.
- ANKI-EDITOR-002: Given text is selected in a field, when Italic is activated, then the selected text is marked italic in stored field HTML/content.
- ANKI-EDITOR-003: Given text is selected in a field, when Underline is activated, then the selected text is marked underlined in stored field HTML/content.
- ANKI-EDITOR-004: Given text is selected in a field, when Superscript or Subscript is activated, then the selected text is wrapped with the corresponding vertical text formatting.
- ANKI-EDITOR-005: Given formatted text is selected in a field, when Clear Formatting is activated, then inline formatting is removed while text remains.
- ANKI-EDITOR-006: Given text is selected in a field, when a text color is chosen, then the selected text stores the chosen foreground color and the color becomes the last-used text color.
- ANKI-EDITOR-007: Given text is selected in a field, when a highlight color is chosen, then the selected text stores the chosen highlight color and the color becomes the last-used highlight color.
- ANKI-EDITOR-008: Given the current note type is cloze-capable, when Cloze is activated on selected text, then the text is wrapped in a cloze deletion using the next cloze number unless alternate-number reuse is requested.
- ANKI-EDITOR-009: Given the current note type is not cloze-capable, when Cloze is activated, then the app warns that cloze deletions will not work or prevents the operation outside add mode.
- ANKI-EDITOR-010: Given the user attaches a supported media file, when the file is accepted, then the file is copied to the collection media folder and an image tag or sound reference is inserted into the current field.
- ANKI-EDITOR-011: Given the user records audio, when recording is completed, then the recorded audio is saved to media and inserted into the current field.
- ANKI-EDITOR-012: Given pasted external HTML contains script, iframe, object, or style tags, when pasted into a field, then those tags are removed before insertion.
- ANKI-EDITOR-013: Given pasted external HTML contains remote image URLs, when pasted into a field, then supported remote images are downloaded into media and rewritten to local media references.
- ANKI-EDITOR-014: Given pasted image data is present, when pasted into a field, then the image is written to media using PNG or JPG according to the paste-images preference.
- ANKI-EDITOR-015: Given a field has duplicate first-field content, when duplicate checking completes, then the first field is visually marked as duplicate and Duplicate lookup can open matching notes in Browser.
- ANKI-EDITOR-016: Given the user edits tags in the editor, when tag focus is lost or tags are saved, then the note tags are updated.
- ANKI-EDITOR-017: Given the user selects image occlusion from file, when an image is chosen, then the image occlusion mask editor opens with that image loaded.
- ANKI-EDITOR-018: Given the clipboard contains an image, when image occlusion from clipboard is activated, then the mask editor opens using the clipboard image.
- ANKI-EDITOR-019: Given the clipboard does not contain an image, when image occlusion from clipboard is activated, then the app shows a no-image-found warning.
