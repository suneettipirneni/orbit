# Backups And Maintenance

## Purpose

Backups and maintenance tools protect local collection data and help detect or repair collection/media problems.

## Backups

Entry points:

- File > Create Backup.
- File > Revert to Backup.
- Preferences > Backups.

Preferences:

- Minutes between backups.
- Daily backups to keep.
- Weekly backups to keep.
- Monthly backups to keep.
- Backup folder restore guidance.

Important behavior:

- Collection backups protect database state.
- Media is called out separately and is not covered by normal collection backups in the same way.

## Maintenance Tools

Tools menu:

- Check Database.
- Check Media.
- Empty Cards.

Check Database:

- Validates and repairs collection database consistency.
- Can update collection metadata and should be treated as a maintenance operation.

Check Media:

- Compares media references in notes/cards with files in the media folder.
- Helps identify missing files and unused files.
- Can delete unused media by moving it to Anki's media trash.
- Can add a missing-media tag to notes with missing media references.
- Can render missing LaTeX media when missing files are LaTeX outputs.
- Can empty or restore media trash when trash contents exist.
- Can open the media folder.

Empty Cards:

- Shows cards that no longer render useful content because templates or fields are empty.
- Offers a keep-notes option so cards can be removed without deleting note data.

## Out Of Scope

Network sync and add-on maintenance are excluded from this pass.

## Testable Criteria

- ANKI-BACKUP-001: Given File > Create Backup is activated, when the operation completes, then a new collection backup is available in the backup location.
- ANKI-BACKUP-002: Given backups exist, when File > Revert to Backup is activated, then the user can choose from available backups before any restore occurs.
- ANKI-BACKUP-003: Given the user selects a backup to restore and confirms, when restore completes, then the collection database state matches the selected backup.
- ANKI-BACKUP-004: Given Preferences > Backups is open, when it renders, then controls for minutes between backups, daily backups, weekly backups, and monthly backups are visible.
- ANKI-BACKUP-005: Given minutes between backups is set to N and saved, when automatic backup timing is evaluated, then backups are not created more frequently than every N minutes.
- ANKI-BACKUP-006: Given daily, weekly, or monthly backup retention counts are set and saved, when backup cleanup runs, then retained backups do not exceed those configured counts for each retention class.
- ANKI-BACKUP-007: Given Preferences > Backups is open, when it renders, then it displays guidance that media is not backed up by normal collection backups.
- ANKI-MAINT-001: Given Check Database is activated, when the operation completes, then the app reports completion and the collection remains open.
- ANKI-MAINT-002: Given database inconsistencies are detected by Check Database, when repair is possible, then the maintenance operation repairs or reports the specific issue.
- ANKI-MAINT-003: Given Check Media is activated, when the operation completes, then the app reports media referenced by notes but missing from disk and media files on disk that are unused.
- ANKI-MAINT-004: Given unused media files are reported, when the user chooses deletion and confirms, then those unused media files are removed from the media folder.
- ANKI-MAINT-005: Given missing media references are reported, when no deletion is requested, then note/card content remains unchanged.
- ANKI-MAINT-006: Given Empty Cards is activated, when empty cards exist, then the dialog lists card templates/cards that currently render empty.
- ANKI-MAINT-007: Given Empty Cards is activated and no empty cards exist, when the scan completes, then the app reports that no empty cards were found.
- ANKI-MAINT-008: Given Empty Cards lists empty cards and Keep Notes is enabled, when the user deletes/removes empty cards, then notes are preserved and only empty card records are removed.
- ANKI-MAINT-009: Given Check Media reports missing media and missing-media note IDs, when Add Tag is activated, then affected notes receive the missing-media tag.
- ANKI-MAINT-010: Given Check Media reports missing LaTeX-generated media, when Render LaTeX is activated, then Anki attempts to render all LaTeX media and reports completion.
- ANKI-MAINT-011: Given Check Media moved unused files to media trash, when Empty Trash is activated, then trashed media files are permanently removed.
- ANKI-MAINT-012: Given media trash contains files, when Restore Trash is activated, then trashed files are restored to the media folder.
- ANKI-MAINT-013: Given Check Media dialog is open, when Open Media Folder is activated, then the system file browser opens the collection media folder.
- ANKI-MAINT-014: Given Empty Cards lists cards and Keep Notes is disabled, when deletion is confirmed, then empty cards are deleted and notes that no longer have cards may also be deleted according to Anki's empty-card deletion result.
- ANKI-MAINT-015: Given Empty Cards deletes cards, when the operation completes, then the app reports the number of deleted cards.
