# Note Types, Fields, and Card Templates

## Purpose

Note types define the data schema for notes and the card templates generated from that data. This is Anki's model layer for authoring.

## Manage Note Types

The Note Types dialog lists available note types and provides entry points for note-type operations such as adding, renaming, deleting, cloning, and configuring the selected type.

When opened from the main Tools menu, it exposes Fields and Cards actions for the selected note type. Options opens note-type-level LaTeX settings.

## Fields

Fields define the editable values stored on each note.

User capabilities:

- Add a field.
- Delete a field.
- Rename a field.
- Reposition fields.
- Set a field description.
- Choose editing font and font size.
- Mark a field as the browser sort field.
- Set right-to-left text direction.
- Treat field content as HTML by default.
- Collapse a field by default.
- Exclude a field from search.

## Card Templates

Card templates define how note fields become card fronts, backs, and styling.

Primary controls:

- Card type selector.
- Template options menu.
- Front template editor.
- Back template editor.
- Styling editor.
- Template search box.
- Preview/result feedback when changes affect multiple cards.
- Add Field helper for inserting field references into front/back templates.
- Flip helper for basic templates.
- More/options menu for card type management and template utilities.

Template more/options menu:

- Restore to default.
- Add card type.
- Remove card type.
- Rename card type.
- Reposition card type.
- Deck override for new cards from that template.
- Copy template info as markdown.
- Browser appearance.

Preview settings:

- Fill empty fields when previewing templates.
- Night mode preview.
- Add mobile class preview.

Browser appearance controls:

- Browser question format.
- Browser answer format.
- Optional override font and font size.

## Note-Type Options

Note type options configure LaTeX behavior:

- Generate scalable images with dvisvgm.
- LaTeX header.
- LaTeX footer.

## Behavior

A note type may produce multiple card types from one note. Field changes alter the schema for all notes using the note type. Template changes affect rendering and card generation for all cards of that template.

## Testable Criteria

- ANKI-NOTETYPE-001: Given Manage Note Types opens, when it renders, then all available note types are listed.
- ANKI-NOTETYPE-002: Given the user creates a note type with a unique name, when creation is confirmed, then the note type appears in the note type list.
- ANKI-NOTETYPE-003: Given an existing note type is selected, when the user renames it to a valid unique name, then the note type list shows the new name and notes keep their association.
- ANKI-NOTETYPE-004: Given an existing note type is selected, when the user clones it, then a separate note type is created with equivalent fields and templates.
- ANKI-NOTETYPE-005: Given an unused note type is selected, when the user deletes it and confirms, then it is removed from the note type list.
- ANKI-FIELDS-001: Given the Fields dialog opens for a note type, when it renders, then fields are listed in their current order.
- ANKI-FIELDS-002: Given the user adds a field with a valid unique name, when saved, then the field appears in the field list and on notes using that note type.
- ANKI-FIELDS-003: Given a field exists, when the user renames it and saves, then templates and note data reference the renamed field.
- ANKI-FIELDS-004: Given multiple fields exist, when the user repositions a field and saves, then the field list order changes accordingly.
- ANKI-FIELDS-005: Given a field exists, when the user deletes it and confirms, then that field is removed from the note type and note editor.
- ANKI-FIELDS-006: Given a field exists, when the user sets a description and saves, then the field stores and displays that description where field descriptions are shown.
- ANKI-FIELDS-007: Given a field exists, when the user changes editing font or font size and saves, then that field's editor uses the configured font settings.
- ANKI-FIELDS-008: Given a field is marked as the sort field, when Browser rows are sorted by sort field, then that field's values are used for sorting.
- ANKI-FIELDS-009: Given a field has right-to-left enabled, when the field is edited, then text direction is right-to-left in the editor.
- ANKI-FIELDS-010: Given a field has plain/HTML default behavior changed, when new content is entered, then stored content follows that field's configured default.
- ANKI-FIELDS-011: Given a field is set to collapse by default, when the note editor opens, then the field starts collapsed.
- ANKI-FIELDS-012: Given a field is excluded from search, when a Browser search only matches text in that field, then the note is not returned by normal field search.
- ANKI-TEMPLATE-001: Given card template editing opens, when it renders, then a card type selector and Front, Back, and Style editing modes are available.
- ANKI-TEMPLATE-002: Given the user selects a card type, when the selection changes, then the editor loads that card type's front, back, and style templates.
- ANKI-TEMPLATE-003: Given the user edits the front template and saves, when a card of that type renders its question side, then the updated front template is used.
- ANKI-TEMPLATE-004: Given the user edits the back template and saves, when a card of that type renders its answer side, then the updated back template is used.
- ANKI-TEMPLATE-005: Given the user edits styling and saves, when cards of that note type render, then the updated CSS/style is applied.
- ANKI-TEMPLATE-006: Given a template edit would affect existing cards, when the editor displays the change impact notice, then it indicates that existing cards will be affected.
- ANKI-NOTETYPE-006: Given Manage Note Types is opened from the main Tools menu, when a note type is selected, then Fields and Cards actions are available.
- ANKI-NOTETYPE-007: Given Note Type Options opens, when it renders, then controls for scalable LaTeX images, LaTeX header, and LaTeX footer are visible.
- ANKI-NOTETYPE-008: Given scalable LaTeX images is toggled and saved, when LaTeX is rendered for that note type, then image generation uses the saved scalable-image setting.
- ANKI-NOTETYPE-009: Given LaTeX header/footer text is edited and saved, when LaTeX is rendered for that note type, then the saved header/footer are used.
- ANKI-TEMPLATE-007: Given the user activates Add Field while editing the front template, when a field is chosen, then that field reference is inserted into the front template at the cursor.
- ANKI-TEMPLATE-008: Given the user activates Add Field while editing the back template, when a field is chosen, then that field reference is inserted into the back template at the cursor.
- ANKI-TEMPLATE-009: Given the user activates Flip on a basic card template with a recognizable answer separator, when saved, then front and back template content are swapped according to Anki's flip behavior.
- ANKI-TEMPLATE-010: Given the user selects Restore to Default and confirms, when the operation completes, then the note type templates are reset to the selected stock/default template.
- ANKI-TEMPLATE-011: Given the note type is not cloze-only, when Add Card Type is confirmed, then a new card template is added to the note type.
- ANKI-TEMPLATE-012: Given a removable card type exists, when Remove Card Type is confirmed, then that card template is removed and affected cards are removed or regenerated according to Anki behavior.
- ANKI-TEMPLATE-013: Given a card type exists, when Rename Card Type is confirmed with a valid name, then the template name changes.
- ANKI-TEMPLATE-014: Given multiple card types exist, when Reposition Card Type is confirmed, then the template ordinal/order changes.
- ANKI-TEMPLATE-015: Given deck override is set for a card template, when new cards are generated from that template, then they are assigned to the override deck.
- ANKI-TEMPLATE-016: Given deck override is cleared for a card template, when new cards are generated from that template, then normal deck assignment rules apply.
- ANKI-TEMPLATE-017: Given Copy Template Info is activated, when the command completes, then markdown containing the current front template, back template, and styling is placed on the clipboard.
- ANKI-TEMPLATE-018: Given Browser Appearance is configured for a card template, when cards of that template appear in Browser columns/preview fields that use browser appearance, then the configured browser question/answer format and optional font settings apply.
- ANKI-TEMPLATE-PREVIEW-001: Given Fill Empty is enabled in template preview, when previewing a card with empty fields, then placeholder/fill behavior is used so the preview can render.
- ANKI-TEMPLATE-PREVIEW-002: Given Night Mode preview is enabled, when previewing a template, then preview styling uses night-mode class/state.
- ANKI-TEMPLATE-PREVIEW-003: Given Add Mobile Class is enabled, when previewing a template, then preview styling includes the mobile class/state.
