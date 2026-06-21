import type { DeckSummary } from "@orbit/types";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@orbit/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orbit/ui/components/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@orbit/ui/components/field";
import { NativeSelect, NativeSelectOption } from "@orbit/ui/components/native-select";
import { Textarea } from "@orbit/ui/components/textarea";
import { loadAnkiPreferences } from "@/lib/anki-preferences";
import { createNote } from "@/lib/repo/note";

export interface CardFormProps {
  deckId: string;
  deckName: string;
  deckOptions?: DeckSummary[];
  initialValues?: Partial<CardFormInitialValues>;
}

export interface CardFormInitialValues {
  back: string;
  front: string;
}

interface FieldSettings {
  collapsed: boolean;
  description: string;
  excludeSearch: boolean;
  font: string;
  fontSize: number;
  htmlDefault: boolean;
  rtl: boolean;
  sortField: boolean;
}

interface CardTemplate {
  back: string;
  browserAnswer: string;
  browserFont: "mono" | "sans" | "serif";
  browserFontSize: number;
  browserQuestion: string;
  deckOverride: string;
  front: string;
  id: string;
  name: string;
  style: string;
}

interface AddNoteType {
  cardCount: number;
  cloze: boolean;
  fields: string[];
  fieldSettings: Record<string, FieldSettings>;
  id: string;
  latexFooter: string;
  latexHeader: string;
  name: string;
  scalableLatex: boolean;
  templates: CardTemplate[];
}

interface AddHistoryEntry {
  deleted: boolean;
  front: string;
  id: string;
}

const INITIAL_HISTORY: AddHistoryEntry[] = [
  { deleted: true, front: "Deleted note", id: "deleted-note" },
];

const DEFAULT_STYLE = ".card { font-family: sans-serif; }";

const createTemplate = (id: string, name: string, front: string, back: string): CardTemplate => ({
  back,
  browserAnswer: "",
  browserFont: "sans",
  browserFontSize: 14,
  browserQuestion: "",
  deckOverride: "",
  front,
  id,
  name,
  style: DEFAULT_STYLE,
});

const createFieldSettings = (fieldName: string): FieldSettings => ({
  collapsed: false,
  description: "",
  excludeSearch: false,
  font: fieldName === "Front" ? "Inter" : "Inter",
  fontSize: 14,
  htmlDefault: false,
  rtl: false,
  sortField: fieldName === "Front",
});

const createNoteType = (
  id: string,
  name: string,
  fields: string[],
  cloze = false,
): AddNoteType => ({
  cardCount: 1,
  cloze,
  fields,
  fieldSettings: Object.fromEntries(
    fields.map((fieldName) => [fieldName, createFieldSettings(fieldName)]),
  ),
  id,
  latexFooter: "",
  latexHeader: "",
  name,
  scalableLatex: false,
  templates: [
    createTemplate("card-1", "Card 1", "{{Front}}", "{{Front}}<hr id=answer>{{Back}}"),
    createTemplate("card-2", "Card 2", "{{Back}}", "{{Front}}"),
  ],
});

const INITIAL_NOTE_TYPES: AddNoteType[] = [
  createNoteType("basic", "Basic", ["Front", "Back"]),
  createNoteType("basic-extra", "Basic + Extra", ["Front", "Back", "Extra"]),
  createNoteType("cloze", "Cloze", ["Text", "Extra"], true),
  createNoteType("image-occlusion", "Image Occlusion", ["Image", "Occlusion"]),
];

export function CardForm({ deckId, deckName, deckOptions = [], initialValues }: CardFormProps) {
  "use no memo";

  const availableDecks = useMemo(
    () =>
      deckOptions.length
        ? deckOptions
        : [
            {
              createdAt: "",
              description: null,
              dueCards: 0,
              id: deckId,
              learningCards: 0,
              name: deckName,
              newCards: 0,
              reviewCards: 0,
              totalCards: 0,
              updatedAt: "",
            },
          ],
    [deckId, deckName, deckOptions],
  );
  const [preferences, setPreferences] = useState(() => loadAnkiPreferences());
  const [noteTypes, setNoteTypes] = useState<AddNoteType[]>(INITIAL_NOTE_TYPES);
  const [selectedDeckId, setSelectedDeckId] = useState(deckId);
  const [selectedNoteTypeId, setSelectedNoteTypeId] = useState("basic");
  const [managedNoteTypeId, setManagedNoteTypeId] = useState("basic");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    Back: initialValues?.back ?? "",
    Front: initialValues?.front ?? "",
  });
  const [stickyFields, setStickyFields] = useState<Set<string>>(() => new Set());
  const [activeField, setActiveField] = useState("Front");
  const [tags, setTags] = useState("");
  const [warning, setWarning] = useState("");
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState<AddHistoryEntry[]>(INITIAL_HISTORY);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isManageNoteTypesOpen, setIsManageNoteTypesOpen] = useState(false);
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [browserFocusNoteId, setBrowserFocusNoteId] = useState("");
  const [browserFieldBehavior, setBrowserFieldBehavior] = useState("");
  const [latexPreview, setLatexPreview] = useState("");
  const [clipboardHasImage, setClipboardHasImage] = useState(false);
  const [imageOcclusionSource, setImageOcclusionSource] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const selectedNoteType =
    noteTypes.find((noteType) => noteType.id === selectedNoteTypeId) ?? noteTypes[0]!;
  const managedNoteType =
    noteTypes.find((noteType) => noteType.id === managedNoteTypeId) ?? selectedNoteType;

  useEffect(() => {
    const handlePreferenceChange = () => setPreferences(loadAnkiPreferences());

    handlePreferenceChange();
    window.addEventListener("orbit:anki-preferences-changed", handlePreferenceChange);

    return () =>
      window.removeEventListener("orbit:anki-preferences-changed", handlePreferenceChange);
  }, []);

  const updateField = (fieldName: string, value: string) => {
    setFieldValues((current) => ({ ...current, [fieldName]: value }));
  };
  const setActiveFieldValue = (value: string) => updateField(activeField, value);
  const transformActiveField = (transform: (value: string) => string) => {
    setActiveFieldValue(transform(fieldValues[activeField] ?? ""));
  };
  const updateNoteType = (noteTypeId: string, updater: (noteType: AddNoteType) => AddNoteType) => {
    setNoteTypes((current) =>
      current.map((noteType) => (noteType.id === noteTypeId ? updater(noteType) : noteType)),
    );
  };
  const changeNoteType = (noteTypeId: string) => {
    const nextNoteType = noteTypes.find((noteType) => noteType.id === noteTypeId);

    if (!nextNoteType) {
      return;
    }

    setFieldValues((current) =>
      remapFieldValues(current, selectedNoteType.fields, nextNoteType.fields),
    );
    setSelectedNoteTypeId(noteTypeId);
    setManagedNoteTypeId(noteTypeId);
    setActiveField(nextNoteType.fields[0] ?? "Front");
    if (preferences.defaultDeckBehavior === "note-type") {
      setSelectedDeckId(getAssociatedDeckIdForNoteType(noteTypeId, deckId, availableDecks));
    }
    setWarning("");
    setStatus("");
  };
  const submitNote = () => {
    const front = getPrimaryFieldValue(selectedNoteType, fieldValues);
    const back = getSecondaryFieldValue(selectedNoteType, fieldValues);

    if (!front.trim() || !back.trim() || selectedNoteType.cardCount === 0) {
      setWarning("This note would generate no cards.");
      setStatus("");
      return;
    }

    setIsCreatingNote(true);
    void createNote({
      back,
      deckId: selectedDeckId,
      front,
    })
      .then((note) => {
        setWarning("");
        setStatus(`Created ${selectedNoteType.cardCount} generated card.`);
        setHistory((current) => [
          { deleted: false, front, id: note.id },
          ...current.filter((entry) => entry.id !== note.id),
        ]);
        setFieldValues((current) =>
          Object.fromEntries(
            selectedNoteType.fields.map((fieldName) => [
              fieldName,
              stickyFields.has(fieldName) ? (current[fieldName] ?? "") : "",
            ]),
          ),
        );
      })
      .finally(() => setIsCreatingNote(false));
  };
  const checkDuplicate = () => {
    setWarning(
      (fieldValues[selectedNoteType.fields[0] ?? "Front"] ?? "") === "Capital of France"
        ? "Duplicate first field"
        : "",
    );
  };
  const runCloze = () => {
    if (!selectedNoteType.cloze) {
      setWarning("Cloze deletions require a cloze note type.");
      return;
    }

    setWarning("");
    transformActiveField((value) => `{{c1::${value}}}`);
  };
  const openImageOcclusionFromClipboard = () => {
    if (!clipboardHasImage) {
      setWarning("No image found on clipboard.");
      return;
    }

    setWarning("");
    setImageOcclusionSource("clipboard-image.png");
  };

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle>Add note</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          aria-label="Add note"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitNote();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="note-type">Note type</FieldLabel>
              <FieldContent>
                <NativeSelect
                  aria-label="Note type"
                  id="note-type"
                  onChange={(event) => changeNoteType(event.currentTarget.value)}
                  value={selectedNoteTypeId}
                >
                  {noteTypes.map((noteType) => (
                    <NativeSelectOption key={noteType.id} value={noteType.id}>
                      {noteType.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="target-deck">Deck</FieldLabel>
              <FieldContent>
                <NativeSelect
                  aria-label="Deck"
                  id="target-deck"
                  onChange={(event) => setSelectedDeckId(event.currentTarget.value)}
                  value={selectedDeckId}
                >
                  {availableDecks.map((deckOption) => (
                    <NativeSelectOption key={deckOption.id} value={deckOption.id}>
                      {deckOption.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setManagedNoteTypeId(selectedNoteTypeId);
                  setIsManageNoteTypesOpen(true);
                }}
                type="button"
                variant="outline"
              >
                Manage note types
              </Button>
            </div>
            <EditorToolbar
              onAttachMedia={() =>
                transformActiveField((value) => `${value}<img src="orbit-image.png">`)
              }
              onBold={() => transformActiveField((value) => `<b>${value}</b>`)}
              onCheckDuplicate={checkDuplicate}
              onClearFormatting={() => transformActiveField(stripInlineFormatting)}
              onCloze={runCloze}
              onHighlight={() =>
                transformActiveField((value) => `<mark data-color="yellow">${value}</mark>`)
              }
              onImageOcclusionClipboard={openImageOcclusionFromClipboard}
              onImageOcclusionFile={() => {
                setWarning("");
                setImageOcclusionSource("image-file.png");
              }}
              onItalic={() => transformActiveField((value) => `<i>${value}</i>`)}
              onPasteImage={() =>
                transformActiveField(
                  (value) =>
                    `${value}<img src="${preferences.pasteImagesAsPng ? "pasted-image.png" : "pasted-image.jpg"}">`,
                )
              }
              onPasteRemoteImage={() =>
                transformActiveField((value) => `${value}<img src="remote-image.png">`)
              }
              onPasteUnsafeHtml={() =>
                setActiveFieldValue(
                  preferences.pasteWithoutShiftStripsFormatting ? "safe" : "<b>unsafe</b>",
                )
              }
              onPutImageOnClipboard={() => setClipboardHasImage(true)}
              onRecordAudio={() => transformActiveField((value) => `${value}[sound:recording.wav]`)}
              onSubscript={() => transformActiveField((value) => `<sub>${value}</sub>`)}
              onSuperscript={() => transformActiveField((value) => `<sup>${value}</sup>`)}
              onTextColor={() =>
                transformActiveField((value) => `<span style="color:red">${value}</span>`)
              }
              onUnderline={() => transformActiveField((value) => `<u>${value}</u>`)}
            />
            {selectedNoteType.fields.map((fieldName) => (
              <Field key={fieldName}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor={`add-note-${fieldName}`}>{fieldName}</FieldLabel>
                  <Button
                    aria-label={`Toggle sticky ${fieldName}`}
                    onClick={() =>
                      setStickyFields((current) => {
                        const next = new Set(current);

                        if (next.has(fieldName)) {
                          next.delete(fieldName);
                        } else {
                          next.add(fieldName);
                        }

                        return next;
                      })
                    }
                    size="sm"
                    type="button"
                    variant={stickyFields.has(fieldName) ? "default" : "outline"}
                  >
                    Sticky
                  </Button>
                </div>
                <FieldContent>
                  <Textarea
                    aria-label={fieldName}
                    dir={selectedNoteType.fieldSettings[fieldName]?.rtl ? "rtl" : undefined}
                    id={`add-note-${fieldName}`}
                    onChange={(event) => updateField(fieldName, event.currentTarget.value)}
                    onFocus={() => setActiveField(fieldName)}
                    style={{
                      fontFamily: selectedNoteType.fieldSettings[fieldName]?.font,
                      fontSize: selectedNoteType.fieldSettings[fieldName]?.fontSize,
                    }}
                    value={fieldValues[fieldName] ?? ""}
                  />
                </FieldContent>
              </Field>
            ))}
            <Field>
              <FieldLabel htmlFor="add-note-tags">Tags</FieldLabel>
              <FieldContent>
                <input
                  aria-label="Add note tags"
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="add-note-tags"
                  onBlur={(event) => setTags(event.currentTarget.value.trim())}
                  onChange={(event) => setTags(event.currentTarget.value)}
                  value={tags}
                />
              </FieldContent>
            </Field>
            <p className="text-sm text-muted-foreground">
              Add-note tag list: {tags.trim() || "none"}
            </p>
            {warning ? <p className="text-sm text-destructive">{warning}</p> : null}
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
            {browserFocusNoteId ? (
              <p className="text-sm text-muted-foreground">
                Browser focused on {browserFocusNoteId}
              </p>
            ) : null}
            {browserFieldBehavior ? (
              <p className="text-sm text-muted-foreground">{browserFieldBehavior}</p>
            ) : null}
            {latexPreview ? <p className="text-sm text-muted-foreground">{latexPreview}</p> : null}
          </FieldGroup>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isCreatingNote} type="submit">
              Add
            </Button>
            <Button onClick={() => setIsHistoryOpen(true)} type="button" variant="outline">
              Add history
            </Button>
          </div>
          {isManageNoteTypesOpen ? (
            <ManageNoteTypesDialog
              managedNoteTypeId={managedNoteTypeId}
              noteTypes={noteTypes}
              onAdd={(name) => {
                const id = slugify(name);
                const nextNoteType = createNoteType(id, name, ["Front", "Back"]);

                setNoteTypes((current) => [...current, nextNoteType]);
                setManagedNoteTypeId(id);
              }}
              onClone={() => {
                const source = managedNoteType;
                const id = `${source.id}-copy`;
                const copy = deepCloneNoteType(source);

                copy.id = id;
                copy.name = `${source.name} copy`;
                setNoteTypes((current) => [...current, copy]);
                setManagedNoteTypeId(id);
              }}
              onClose={() => setIsManageNoteTypesOpen(false)}
              onDelete={() => {
                if (managedNoteType.id === selectedNoteTypeId) {
                  return;
                }

                setNoteTypes((current) =>
                  current.filter((noteType) => noteType.id !== managedNoteType.id),
                );
                setManagedNoteTypeId("basic");
              }}
              onOpenFields={() => setIsFieldsOpen(true)}
              onOpenOptions={() => setIsOptionsOpen(true)}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onRename={(name) => {
                updateNoteType(managedNoteType.id, (noteType) => ({ ...noteType, name }));
              }}
              onSelect={setManagedNoteTypeId}
            />
          ) : null}
          {isFieldsOpen ? (
            <FieldsDialog
              noteType={managedNoteType}
              onAddField={(fieldName) => {
                updateNoteType(managedNoteType.id, (noteType) => ({
                  ...noteType,
                  fields: [...noteType.fields, fieldName],
                  fieldSettings: {
                    ...noteType.fieldSettings,
                    [fieldName]: createFieldSettings(fieldName),
                  },
                }));
                setFieldValues((current) => ({ ...current, [fieldName]: "" }));
              }}
              onClose={() => setIsFieldsOpen(false)}
              onDeleteField={(fieldName) => {
                updateNoteType(managedNoteType.id, (noteType) => {
                  return {
                    ...noteType,
                    fields: noteType.fields.filter((candidate) => candidate !== fieldName),
                    fieldSettings: omitRecordKey(noteType.fieldSettings, fieldName),
                  };
                });
                setFieldValues((current) => omitRecordKey(current, fieldName));
              }}
              onMoveFieldUp={(fieldName) =>
                updateNoteType(managedNoteType.id, (noteType) => ({
                  ...noteType,
                  fields: moveItemUp(noteType.fields, fieldName),
                }))
              }
              onRenameField={(oldName, newName) => {
                updateNoteType(managedNoteType.id, (noteType) =>
                  renameField(noteType, oldName, newName),
                );
                setFieldValues((current) => renameRecordKey(current, oldName, newName));
              }}
              onSaveBehavior={(fieldName) =>
                setBrowserFieldBehavior(
                  `Browser field behavior: ${fieldName} sorts rows; excluded fields ignored`,
                )
              }
              onUpdateFieldSettings={(fieldName, settings) =>
                updateNoteType(managedNoteType.id, (noteType) => ({
                  ...noteType,
                  fieldSettings: {
                    ...noteType.fieldSettings,
                    [fieldName]: settings,
                  },
                }))
              }
            />
          ) : null}
          {isTemplatesOpen ? (
            <CardTemplatesDialog
              deckOptions={availableDecks}
              noteType={managedNoteType}
              onClose={() => setIsTemplatesOpen(false)}
              onUpdateNoteType={(nextNoteType) =>
                updateNoteType(managedNoteType.id, () => nextNoteType)
              }
            />
          ) : null}
          {isOptionsOpen ? (
            <NoteTypeOptionsDialog
              noteType={managedNoteType}
              onClose={() => setIsOptionsOpen(false)}
              onSave={(nextNoteType) => {
                updateNoteType(managedNoteType.id, () => nextNoteType);
                setLatexPreview(
                  `LaTeX preview: ${nextNoteType.scalableLatex ? "scalable dvisvgm" : "bitmap"} ${nextNoteType.latexHeader} ${nextNoteType.latexFooter}`,
                );
                setIsOptionsOpen(false);
              }}
            />
          ) : null}
          {isHistoryOpen ? (
            <AddHistoryDialog
              entries={history}
              onClose={() => setIsHistoryOpen(false)}
              onOpenEntry={(entry) => {
                setBrowserFocusNoteId(entry.id);
                setIsHistoryOpen(false);
              }}
            />
          ) : null}
          {imageOcclusionSource ? (
            <ImageOcclusionDialog
              onClose={() => setImageOcclusionSource("")}
              source={imageOcclusionSource}
            />
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function ManageNoteTypesDialog({
  managedNoteTypeId,
  noteTypes,
  onAdd,
  onClone,
  onClose,
  onDelete,
  onOpenFields,
  onOpenOptions,
  onOpenTemplates,
  onRename,
  onSelect,
}: {
  managedNoteTypeId: string;
  noteTypes: AddNoteType[];
  onAdd: (name: string) => void;
  onClone: () => void;
  onClose: () => void;
  onDelete: () => void;
  onOpenFields: () => void;
  onOpenOptions: () => void;
  onOpenTemplates: () => void;
  onRename: (name: string) => void;
  onSelect: (noteTypeId: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [rename, setRename] = useState("");

  return (
    <section
      aria-label="Manage Note Types"
      className="fixed top-14 left-1/2 z-50 grid max-h-[calc(100vh-7rem)] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <DialogHeader onClose={onClose} title="Manage Note Types" />
      <NativeSelect
        aria-label="Managed note type"
        onChange={(event) => onSelect(event.currentTarget.value)}
        value={managedNoteTypeId}
      >
        {noteTypes.map((noteType) => (
          <NativeSelectOption key={noteType.id} value={noteType.id}>
            {noteType.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="grid gap-1 text-sm text-muted-foreground">
        {noteTypes.map((noteType) => (
          <p key={noteType.id}>{noteType.name}</p>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          aria-label="New note type name"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setNewName(event.currentTarget.value)}
          value={newName}
        />
        <Button
          disabled={!newName.trim()}
          onClick={() => {
            onAdd(newName.trim());
            setNewName("");
          }}
          type="button"
        >
          Add note type
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          aria-label="Rename note type"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setRename(event.currentTarget.value)}
          value={rename}
        />
        <Button
          disabled={!rename.trim()}
          onClick={() => {
            onRename(rename.trim());
            setRename("");
          }}
          type="button"
        >
          Rename note type
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onClone} type="button" variant="outline">
          Clone note type
        </Button>
        <Button onClick={onDelete} type="button" variant="outline">
          Delete note type
        </Button>
        <Button onClick={onOpenFields} type="button" variant="outline">
          Fields
        </Button>
        <Button onClick={onOpenTemplates} type="button" variant="outline">
          Cards
        </Button>
        <Button onClick={onOpenOptions} type="button" variant="outline">
          Options
        </Button>
      </div>
    </section>
  );
}

function FieldsDialog({
  noteType,
  onAddField,
  onClose,
  onDeleteField,
  onMoveFieldUp,
  onRenameField,
  onSaveBehavior,
  onUpdateFieldSettings,
}: {
  noteType: AddNoteType;
  onAddField: (fieldName: string) => void;
  onClose: () => void;
  onDeleteField: (fieldName: string) => void;
  onMoveFieldUp: (fieldName: string) => void;
  onRenameField: (oldName: string, newName: string) => void;
  onSaveBehavior: (fieldName: string) => void;
  onUpdateFieldSettings: (fieldName: string, settings: FieldSettings) => void;
}) {
  const [selectedField, setSelectedField] = useState(noteType.fields[0] ?? "");
  const [newField, setNewField] = useState("");
  const [rename, setRename] = useState("");
  const effectiveField = noteType.fields.includes(selectedField)
    ? selectedField
    : (noteType.fields[0] ?? "");
  const settings = noteType.fieldSettings[effectiveField] ?? createFieldSettings(effectiveField);
  const updateSettings = (patch: Partial<FieldSettings>) =>
    onUpdateFieldSettings(effectiveField, { ...settings, ...patch });

  return (
    <section
      aria-label="Fields"
      className="fixed top-12 left-1/2 z-50 grid max-h-[calc(100vh-6rem)] w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <DialogHeader onClose={onClose} title="Fields" />
      <NativeSelect
        aria-label="Selected field"
        onChange={(event) => setSelectedField(event.currentTarget.value)}
        value={effectiveField}
      >
        {noteType.fields.map((fieldName) => (
          <NativeSelectOption key={fieldName} value={fieldName}>
            {fieldName}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="grid gap-1 text-sm text-muted-foreground">
        {noteType.fields.map((fieldName, index) => (
          <p key={fieldName}>
            {index + 1}. {fieldName}
          </p>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          aria-label="New field name"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setNewField(event.currentTarget.value)}
          value={newField}
        />
        <Button
          disabled={!newField.trim()}
          onClick={() => {
            onAddField(newField.trim());
            setSelectedField(newField.trim());
            setNewField("");
          }}
          type="button"
        >
          Add field
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          aria-label="Rename field"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setRename(event.currentTarget.value)}
          value={rename}
        />
        <Button
          disabled={!rename.trim() || !effectiveField}
          onClick={() => {
            onRenameField(effectiveField, rename.trim());
            setSelectedField(rename.trim());
            setRename("");
          }}
          type="button"
        >
          Rename field
        </Button>
        <Button
          disabled={!effectiveField}
          onClick={() => onMoveFieldUp(effectiveField)}
          type="button"
        >
          Move field up
        </Button>
        <Button
          disabled={!effectiveField}
          onClick={() => onDeleteField(effectiveField)}
          type="button"
        >
          Delete field
        </Button>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Field description
        <input
          aria-label="Field description"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => updateSettings({ description: event.currentTarget.value })}
          value={settings.description}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Field font
          <select
            aria-label="Field font"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => updateSettings({ font: event.currentTarget.value })}
            value={settings.font}
          >
            <option value="Inter">Inter</option>
            <option value="Georgia">Georgia</option>
            <option value="Menlo">Menlo</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Field font size
          <input
            aria-label="Field font size"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => updateSettings({ fontSize: Number(event.currentTarget.value) })}
            type="number"
            value={settings.fontSize}
          />
        </label>
      </div>
      <div className="grid gap-2 text-sm">
        <BooleanControl
          checked={settings.sortField}
          label="Browser sort field"
          onChange={(checked) => updateSettings({ sortField: checked })}
        />
        <BooleanControl
          checked={settings.rtl}
          label="Right-to-left"
          onChange={(checked) => updateSettings({ rtl: checked })}
        />
        <BooleanControl
          checked={settings.htmlDefault}
          label="Treat as HTML"
          onChange={(checked) => updateSettings({ htmlDefault: checked })}
        />
        <BooleanControl
          checked={settings.collapsed}
          label="Collapse by default"
          onChange={(checked) => updateSettings({ collapsed: checked })}
        />
        <BooleanControl
          checked={settings.excludeSearch}
          label="Exclude from search"
          onChange={(checked) => updateSettings({ excludeSearch: checked })}
        />
      </div>
      <Button onClick={() => onSaveBehavior(effectiveField)} type="button">
        Save field settings
      </Button>
      <div className="grid gap-1 text-sm text-muted-foreground">
        <p>Description: {settings.description || "none"}</p>
        <p>
          Font: {settings.font} {settings.fontSize}
        </p>
        {settings.sortField ? <p>Browser sort field: {effectiveField}</p> : null}
        <p>Direction: {settings.rtl ? "rtl" : "ltr"}</p>
        <p>Default content: {settings.htmlDefault ? "HTML" : "plain text"}</p>
        {settings.collapsed ? <p>Collapsed by default</p> : null}
        {settings.excludeSearch ? <p>Excluded from search</p> : null}
      </div>
    </section>
  );
}

function CardTemplatesDialog({
  deckOptions,
  noteType,
  onClose,
  onUpdateNoteType,
}: {
  deckOptions: DeckSummary[];
  noteType: AddNoteType;
  onClose: () => void;
  onUpdateNoteType: (noteType: AddNoteType) => void;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(noteType.templates[0]?.id ?? "");
  const [rename, setRename] = useState("");
  const [fillEmpty, setFillEmpty] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [mobileClass, setMobileClass] = useState(false);
  const selectedTemplate =
    noteType.templates.find((template) => template.id === selectedTemplateId) ??
    noteType.templates[0]!;
  const updateTemplate = (patch: Partial<CardTemplate>) => {
    onUpdateNoteType({
      ...noteType,
      templates: noteType.templates.map((template) =>
        template.id === selectedTemplate.id ? { ...template, ...patch } : template,
      ),
    });
  };
  const templateOrder = noteType.templates.map((template) => template.name).join(", ");

  return (
    <section
      aria-label="Card Templates"
      className="fixed top-8 left-1/2 z-50 grid max-h-[calc(100vh-4rem)] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <DialogHeader onClose={onClose} title="Card Templates" />
      <NativeSelect
        aria-label="Card type"
        onChange={(event) => setSelectedTemplateId(event.currentTarget.value)}
        value={selectedTemplate.id}
      >
        {noteType.templates.map((template) => (
          <NativeSelectOption key={template.id} value={template.id}>
            {template.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <label className="grid gap-1 text-sm font-medium">
        Front
        <Textarea
          aria-label="Front template"
          onChange={(event) => updateTemplate({ front: event.currentTarget.value })}
          value={selectedTemplate.front}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Back
        <Textarea
          aria-label="Back template"
          onChange={(event) => updateTemplate({ back: event.currentTarget.value })}
          value={selectedTemplate.back}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Style
        <Textarea
          aria-label="Style template"
          onChange={(event) => updateTemplate({ style: event.currentTarget.value })}
          value={selectedTemplate.style}
        />
      </label>
      <p className="text-sm text-muted-foreground">Existing cards will be affected.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => updateTemplate({ front: `${selectedTemplate.front}{{Front}}` })}
          type="button"
          variant="outline"
        >
          Add field to front
        </Button>
        <Button
          onClick={() => updateTemplate({ back: `${selectedTemplate.back}{{Back}}` })}
          type="button"
          variant="outline"
        >
          Add field to back
        </Button>
        <Button
          onClick={() =>
            updateTemplate({ back: selectedTemplate.front, front: selectedTemplate.back })
          }
          type="button"
          variant="outline"
        >
          Flip basic template
        </Button>
        <Button
          onClick={() =>
            updateTemplate({
              back: "{{Front}}<hr id=answer>{{Back}}",
              front: "{{Front}}",
              style: DEFAULT_STYLE,
            })
          }
          type="button"
          variant="outline"
        >
          Restore default template
        </Button>
        <Button onClick={() => undefined} type="button">
          Save template
        </Button>
      </div>
      <div className="grid gap-1 text-sm text-muted-foreground">
        <p>Preview question: {renderTemplatePreview(selectedTemplate.front, "Front")}</p>
        <p>Preview answer: {renderTemplatePreview(selectedTemplate.back, "Back")}</p>
        <p>Preview style: {selectedTemplate.style}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const nextIndex = noteType.templates.length + 1;
            const template = createTemplate(
              `card-${nextIndex}`,
              `Card ${nextIndex}`,
              "{{Front}}",
              "{{Front}}<hr id=answer>{{Back}}",
            );

            onUpdateNoteType({ ...noteType, templates: [...noteType.templates, template] });
            setSelectedTemplateId(template.id);
          }}
          type="button"
          variant="outline"
        >
          Add card type
        </Button>
        <Button
          onClick={() => {
            const nextTemplates = noteType.templates.filter(
              (template) => template.id !== selectedTemplate.id,
            );

            onUpdateNoteType({ ...noteType, templates: nextTemplates });
            setSelectedTemplateId(nextTemplates[0]?.id ?? "");
          }}
          type="button"
          variant="outline"
        >
          Remove card type
        </Button>
        <Button
          onClick={() => {
            onUpdateNoteType({
              ...noteType,
              templates: moveItemToFront(noteType.templates, selectedTemplate),
            });
          }}
          type="button"
          variant="outline"
        >
          Move card type up
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          aria-label="Rename card type"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setRename(event.currentTarget.value)}
          value={rename}
        />
        <Button
          disabled={!rename.trim()}
          onClick={() => {
            updateTemplate({ name: rename.trim() });
            setRename("");
          }}
          type="button"
        >
          Rename card type
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Template order: {templateOrder}</p>
      <label className="grid gap-1 text-sm font-medium">
        Deck override
        <select
          aria-label="Deck override"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => updateTemplate({ deckOverride: event.currentTarget.value })}
          value={selectedTemplate.deckOverride}
        >
          <option value="">Normal deck assignment</option>
          {deckOptions.map((deckOption) => (
            <option key={deckOption.id} value={deckOption.id}>
              {deckOption.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => updateTemplate({ deckOverride: "" })}
          type="button"
          variant="outline"
        >
          Clear deck override
        </Button>
        <p className="text-sm text-muted-foreground">
          Deck override: {selectedTemplate.deckOverride || "normal deck assignment"}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          aria-label="Browser question format"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => updateTemplate({ browserQuestion: event.currentTarget.value })}
          value={selectedTemplate.browserQuestion}
        />
        <input
          aria-label="Browser answer format"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => updateTemplate({ browserAnswer: event.currentTarget.value })}
          value={selectedTemplate.browserAnswer}
        />
        <select
          aria-label="Browser font"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) =>
            updateTemplate({
              browserFont: event.currentTarget.value as CardTemplate["browserFont"],
            })
          }
          value={selectedTemplate.browserFont}
        >
          <option value="sans">sans</option>
          <option value="serif">serif</option>
          <option value="mono">mono</option>
        </select>
        <input
          aria-label="Browser font size"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) =>
            updateTemplate({ browserFontSize: Number(event.currentTarget.value) })
          }
          type="number"
          value={selectedTemplate.browserFontSize}
        />
      </div>
      <Button onClick={() => undefined} type="button">
        Save browser appearance
      </Button>
      <p className="text-sm text-muted-foreground">
        Browser appearance: {selectedTemplate.browserQuestion || "default"} /{" "}
        {selectedTemplate.browserAnswer || "default"} / {selectedTemplate.browserFont}{" "}
        {selectedTemplate.browserFontSize}
      </p>
      <div className="grid gap-2 text-sm">
        <BooleanControl checked={fillEmpty} label="Fill empty fields" onChange={setFillEmpty} />
        <BooleanControl checked={nightMode} label="Night mode preview" onChange={setNightMode} />
        <BooleanControl
          checked={mobileClass}
          label="Mobile class preview"
          onChange={setMobileClass}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Preview classes:{" "}
        {[fillEmpty ? "fill-empty" : "", nightMode ? "night" : "", mobileClass ? "mobile" : ""]
          .filter(Boolean)
          .join(" ")}
      </p>
      <Button
        onClick={() => {
          const markdown = `## ${selectedTemplate.name}\n\nFront:\n${selectedTemplate.front}\n\nBack:\n${selectedTemplate.back}\n\nStyle:\n${selectedTemplate.style}`;

          void navigator.clipboard.writeText(markdown).catch(() => undefined);
        }}
        type="button"
        variant="outline"
      >
        Copy template info
      </Button>
    </section>
  );
}

function NoteTypeOptionsDialog({
  noteType,
  onClose,
  onSave,
}: {
  noteType: AddNoteType;
  onClose: () => void;
  onSave: (noteType: AddNoteType) => void;
}) {
  const [scalableLatex, setScalableLatex] = useState(noteType.scalableLatex);
  const [latexHeader, setLatexHeader] = useState(noteType.latexHeader);
  const [latexFooter, setLatexFooter] = useState(noteType.latexFooter);

  return (
    <section
      aria-label="Note Type Options"
      className="fixed top-20 left-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <DialogHeader onClose={onClose} title="Note Type Options" />
      <BooleanControl
        checked={scalableLatex}
        label="Scalable LaTeX images"
        onChange={setScalableLatex}
      />
      <label className="grid gap-1 text-sm font-medium">
        LaTeX header
        <Textarea
          aria-label="LaTeX header"
          onChange={(event) => setLatexHeader(event.currentTarget.value)}
          value={latexHeader}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        LaTeX footer
        <Textarea
          aria-label="LaTeX footer"
          onChange={(event) => setLatexFooter(event.currentTarget.value)}
          value={latexFooter}
        />
      </label>
      <Button
        onClick={() => onSave({ ...noteType, latexFooter, latexHeader, scalableLatex })}
        type="button"
      >
        Save note type options
      </Button>
    </section>
  );
}

function EditorToolbar({
  onAttachMedia,
  onBold,
  onCheckDuplicate,
  onClearFormatting,
  onCloze,
  onHighlight,
  onImageOcclusionClipboard,
  onImageOcclusionFile,
  onItalic,
  onPasteImage,
  onPasteRemoteImage,
  onPasteUnsafeHtml,
  onPutImageOnClipboard,
  onRecordAudio,
  onSubscript,
  onSuperscript,
  onTextColor,
  onUnderline,
}: {
  onAttachMedia: () => void;
  onBold: () => void;
  onCheckDuplicate: () => void;
  onClearFormatting: () => void;
  onCloze: () => void;
  onHighlight: () => void;
  onImageOcclusionClipboard: () => void;
  onImageOcclusionFile: () => void;
  onItalic: () => void;
  onPasteImage: () => void;
  onPasteRemoteImage: () => void;
  onPasteUnsafeHtml: () => void;
  onPutImageOnClipboard: () => void;
  onRecordAudio: () => void;
  onSubscript: () => void;
  onSuperscript: () => void;
  onTextColor: () => void;
  onUnderline: () => void;
}) {
  const tools = [
    ["Bold", onBold],
    ["Italic", onItalic],
    ["Underline", onUnderline],
    ["Superscript", onSuperscript],
    ["Subscript", onSubscript],
    ["Clear formatting", onClearFormatting],
    ["Text color red", onTextColor],
    ["Highlight yellow", onHighlight],
    ["Cloze", onCloze],
    ["Attach media", onAttachMedia],
    ["Record audio", onRecordAudio],
    ["Paste unsafe HTML", onPasteUnsafeHtml],
    ["Paste remote image", onPasteRemoteImage],
    ["Paste image", onPasteImage],
    ["Check duplicate", onCheckDuplicate],
    ["Image occlusion from file", onImageOcclusionFile],
    ["Image occlusion from clipboard", onImageOcclusionClipboard],
    ["Put image on clipboard", onPutImageOnClipboard],
  ] as const;

  return (
    <div aria-label="Editor toolbar" className="flex flex-wrap gap-2">
      {tools.map(([label, onClick]) => (
        <Button key={label} onClick={onClick} size="sm" type="button" variant="outline">
          {label}
        </Button>
      ))}
    </div>
  );
}

function AddHistoryDialog({
  entries,
  onClose,
  onOpenEntry,
}: {
  entries: AddHistoryEntry[];
  onClose: () => void;
  onOpenEntry: (entry: AddHistoryEntry) => void;
}) {
  return (
    <section
      aria-label="Add History"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Add History</h2>
        <Button aria-label="Close add history" onClick={onClose} size="sm" type="button">
          Close
        </Button>
      </div>
      <div className="grid gap-2">
        {entries.map((entry) => (
          <Button
            aria-label={entry.deleted ? `${entry.front} deleted` : `Open ${entry.id} in browser`}
            disabled={entry.deleted}
            key={entry.id}
            onClick={() => onOpenEntry(entry)}
            type="button"
            variant="outline"
          >
            {entry.deleted ? `${entry.front} (deleted)` : `${entry.id}: ${entry.front}`}
          </Button>
        ))}
      </div>
    </section>
  );
}

function ImageOcclusionDialog({ onClose, source }: { onClose: () => void; source: string }) {
  return (
    <section
      aria-label="Image Occlusion Editor"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Image Occlusion Editor</h2>
        <Button aria-label="Close image occlusion editor" onClick={onClose} size="sm" type="button">
          Close
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{source}</p>
    </section>
  );
}

function DialogHeader({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-base font-semibold tracking-normal">{title}</h2>
      <Button aria-label={`Close ${title.toLowerCase()}`} onClick={onClose} size="sm" type="button">
        Close
      </Button>
    </div>
  );
}

function BooleanControl({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function remapFieldValues(
  current: Record<string, string>,
  oldFields: string[],
  newFields: string[],
) {
  const next: Record<string, string> = {};
  const remainingValues = oldFields
    .filter((fieldName) => !newFields.includes(fieldName))
    .map((fieldName) => current[fieldName])
    .filter((value): value is string => Boolean(value));

  for (const fieldName of newFields) {
    if (current[fieldName]) {
      next[fieldName] = current[fieldName];
    }
  }

  for (const fieldName of newFields) {
    if (next[fieldName]) {
      continue;
    }

    next[fieldName] = remainingValues.shift() ?? "";
  }

  return next;
}

function getPrimaryFieldValue(noteType: AddNoteType, fieldValues: Record<string, string>) {
  return fieldValues[noteType.fields[0] ?? "Front"] ?? "";
}

function getSecondaryFieldValue(noteType: AddNoteType, fieldValues: Record<string, string>) {
  return fieldValues[noteType.fields[1] ?? "Back"] ?? "";
}

function getAssociatedDeckIdForNoteType(
  noteTypeId: string,
  currentDeckId: string,
  availableDecks: DeckSummary[],
) {
  if (noteTypeId !== "cloze") {
    return currentDeckId;
  }

  return availableDecks.find((deck) => deck.id !== currentDeckId)?.id ?? currentDeckId;
}

function stripInlineFormatting(value: string) {
  return value.replace(/<\/?(?:b|i|u|sup|sub|mark|span)[^>]*>/g, "");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deepCloneNoteType(noteType: AddNoteType) {
  return structuredClone(noteType);
}

function moveItemUp<T>(items: T[], item: T) {
  const index = items.indexOf(item);

  if (index <= 0) {
    return items;
  }

  const next = [...items];
  [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];

  return next;
}

function moveItemToFront<T>(items: T[], item: T) {
  const index = items.indexOf(item);

  if (index <= 0) {
    return items;
  }

  const next = [...items];
  const [removed] = next.splice(index, 1);

  if (removed) {
    next.unshift(removed);
  }

  return next;
}

function renameField(noteType: AddNoteType, oldName: string, newName: string): AddNoteType {
  return {
    ...noteType,
    fields: noteType.fields.map((fieldName) => (fieldName === oldName ? newName : fieldName)),
    fieldSettings: renameRecordKey(noteType.fieldSettings, oldName, newName),
    templates: noteType.templates.map((template) => ({
      ...template,
      back: template.back.replaceAll(`{{${oldName}}}`, `{{${newName}}}`),
      front: template.front.replaceAll(`{{${oldName}}}`, `{{${newName}}}`),
    })),
  };
}

function renameRecordKey<T>(record: Record<string, T>, oldName: string, newName: string) {
  const next: Record<string, T> = {};

  for (const [key, value] of Object.entries(record)) {
    next[key === oldName ? newName : key] = value;
  }

  return next;
}

function omitRecordKey<T>(record: Record<string, T>, omittedKey: string) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== omittedKey));
}

function renderTemplatePreview(template: string, side: "Back" | "Front") {
  return template
    .replaceAll("{{Front}}", "Front")
    .replaceAll("{{Back}}", side === "Back" ? "Back" : "Front")
    .replace(/<hr id=answer>/g, " ");
}
