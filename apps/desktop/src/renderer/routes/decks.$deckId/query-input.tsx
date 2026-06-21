import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type FocusEvent,
  type RefObject,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheckIcon,
  CalendarClockIcon,
  FileTextIcon,
  LayersIcon,
  ListChecksIcon,
  NotebookTabsIcon,
  PanelBottomIcon,
  PanelTopIcon,
  SlidersHorizontalIcon,
  TagsIcon,
} from "lucide-react";
import { Badge } from "@orbit/ui/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@orbit/ui/components/command";
import { Popover, PopoverAnchor, PopoverContent } from "@orbit/ui/components/popover";
import { cn } from "@orbit/ui/lib/utils";
import {
  formatQuerySegments,
  parseDraftToken,
  tokenizeQuerySegments,
  type QueryDraftToken,
  type QuerySegment,
} from "./query-language";

export interface QueryInputSuggestions {
  decks?: string[];
  noteTypes?: string[];
  tags?: string[];
}

export interface QueryInputProps {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  onSubmit?: (queryText: string) => void;
  onValueChange?: (queryText: string) => void;
  placeholder?: string;
  suggestions?: QueryInputSuggestions;
  value?: string;
}

interface QuerySuggestion {
  description: string;
  field?: QueryConditionField;
  label: string;
  value: string;
}

type QueryConditionField = NonNullable<QueryDraftToken["field"]>;

const conditionMeta: Record<QueryConditionField, { icon: LucideIcon; label: string }> = {
  back: { icon: PanelBottomIcon, label: "back" },
  card: { icon: BadgeCheckIcon, label: "card" },
  deck: { icon: LayersIcon, label: "deck" },
  front: { icon: PanelTopIcon, label: "front" },
  is: { icon: ListChecksIcon, label: "is" },
  note: { icon: NotebookTabsIcon, label: "note" },
  prop: { icon: SlidersHorizontalIcon, label: "prop" },
  rated: { icon: CalendarClockIcon, label: "rated" },
  tag: { icon: TagsIcon, label: "tag" },
};

const operatorSuggestions: QuerySuggestion[] = [
  { description: "Search a deck", field: "deck", label: "deck:", value: "deck:" },
  { description: "Search a tag", field: "tag", label: "tag:", value: "tag:" },
  { description: "Card state", field: "is", label: "is:", value: "is:" },
  { description: "Card property", field: "prop", label: "prop:", value: "prop:" },
  { description: "Reviewed recently", field: "rated", label: "rated:", value: "rated:" },
  { description: "Front field text", field: "front", label: "front:", value: "front:" },
  { description: "Back field text", field: "back", label: "back:", value: "back:" },
  { description: "Card ordinal", field: "card", label: "card:", value: "card:" },
  { description: "Note type", field: "note", label: "note:", value: "note:" },
];

const stateSuggestions = ["due", "new", "review", "suspended", "buried"];
const propertySuggestions = ["due", "ivl", "reps", "lapses", "ease"];

export function QueryInput({
  className,
  defaultValue = "",
  disabled = false,
  onSubmit,
  onValueChange,
  placeholder = "Search cards...",
  suggestions,
  value,
}: QueryInputProps) {
  const isControlled = value !== undefined;
  const [internalQueryText, setInternalQueryText] = useState(defaultValue);
  const [draftState, setDraftState] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldFocusInputRef = useRef(false);
  const queryText = isControlled ? value : internalQueryText;
  const draft = draftState && queryText.endsWith(draftState) ? draftState : "";
  const committedText = trimDraft(queryText, draft);
  const segments = useMemo(() => tokenizeQuerySegments(committedText), [committedText]);
  const draftToken = useMemo(() => parseDraftToken(draft), [draft]);
  const activeSuggestions = useMemo(
    () => buildSuggestions(draft, suggestions),
    [draft, suggestions],
  );
  const suggestionsOpen =
    !disabled &&
    inputFocused &&
    !suggestionsDismissed &&
    documentHasFocus() &&
    activeSuggestions.length > 0;
  const selectedSuggestion = activeSuggestions[selectedIndex] ?? activeSuggestions[0];

  useEffect(() => {
    if (draftToken) {
      inputRef.current?.focus();
    }
  }, [draftToken]);

  useEffect(() => {
    if (shouldFocusInputRef.current) {
      shouldFocusInputRef.current = false;
      inputRef.current?.focus();
    }
  });

  function updateQueryText(nextQueryText: string, nextDraft = draft) {
    if (!isControlled) {
      setInternalQueryText(nextQueryText);
    }

    if (nextDraft !== draft) {
      setSelectedIndex(0);
      setSuggestionsDismissed(false);
    }

    setDraftState(nextDraft);
    onValueChange?.(nextQueryText);
  }

  function updateDraft(nextDraft: string) {
    updateQueryText(formatQuerySegments(segments, nextDraft), nextDraft);
  }

  function updateDraftTokenValue(nextValue: string) {
    if (!draftToken) {
      updateDraft(nextValue);
      return;
    }

    updateDraft(`${draftToken.negated ? "-" : ""}${draftToken.field}:${nextValue}`);
  }

  function commitDraft() {
    const nextSegments = tokenizeQuerySegments(queryText);
    updateQueryText(formatQuerySegments(nextSegments), "");
  }

  function exitDraftToken() {
    shouldFocusInputRef.current = true;
    setSuggestionsDismissed(true);
    commitDraft();
  }

  function removePreviousSegment() {
    const nextSegments = tokenizeQuerySegments(queryText);

    if (nextSegments.length === 0) {
      return;
    }

    nextSegments.pop();
    updateQueryText(formatQuerySegments(nextSegments), "");
  }

  function applySuggestion(suggestion: QuerySuggestion | undefined) {
    if (!suggestion) {
      return;
    }

    if (isCompleteSuggestion(suggestion.value)) {
      const nextSegments = [...segments, ...tokenizeQuerySegments(suggestion.value)];
      updateQueryText(formatQuerySegments(nextSegments), "");
      return;
    }

    updateDraft(suggestion.value);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestionsOpen) {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % activeSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestionsOpen) {
      event.preventDefault();
      setSelectedIndex((current) => (current === 0 ? activeSuggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Escape" && suggestionsOpen) {
      event.preventDefault();
      setSuggestionsDismissed(true);
      setSelectedIndex(0);
      return;
    }

    if (
      event.key === "Tab" &&
      draftToken &&
      shouldApplyDraftSuggestion(draft, selectedSuggestion)
    ) {
      event.preventDefault();
      applySuggestion(selectedSuggestion);
      return;
    }

    if (event.key === "Tab" && draftToken) {
      event.preventDefault();
      exitDraftToken();
      return;
    }

    if (event.key === "Tab" && suggestionsOpen) {
      event.preventDefault();
      applySuggestion(selectedSuggestion);
      return;
    }

    if (event.key === "Backspace" && draftToken && draftToken.value.length === 0) {
      event.preventDefault();
      updateDraft("");
      return;
    }

    if (event.key === "Backspace" && draft.length === 0) {
      event.preventDefault();
      removePreviousSegment();
      return;
    }

    if (event.key === " " && draft.trim()) {
      event.preventDefault();
      if (draftToken && draftToken.value.length === 0) {
        return;
      }
      commitDraft();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.(queryText.trim());
    }
  }

  function handleInputBlur() {
    window.setTimeout(() => setInputFocused(false), 100);
  }

  function handleInputFocus() {
    setInputFocused(true);
  }

  return (
    <Popover open={suggestionsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {segments.map((segment, index) => (
            <QuerySegmentView index={index} key={`${segment.text}-${index}`} segment={segment} />
          ))}
          {draftToken ? (
            <DraftQuerySegmentInput
              disabled={disabled}
              draftToken={draftToken}
              inputId={inputId}
              inputRef={inputRef}
              onBlur={handleInputBlur}
              onChange={updateDraftTokenValue}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <input
              aria-label="Search cards"
              className="min-w-28 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"
              disabled={disabled}
              id={inputId}
              onBlur={handleInputBlur}
              onChange={(event) => updateDraft(event.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={segments.length === 0 ? placeholder : undefined}
              ref={inputRef}
              value={draft}
            />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
        onOpenAutoFocus={preventDefault}
      >
        <Command shouldFilter={false} value={selectedSuggestion?.value}>
          <CommandList>
            <CommandEmpty>No suggestions</CommandEmpty>
            <CommandGroup>
              {activeSuggestions.map((suggestion, index) => (
                <CommandItem
                  key={suggestion.value}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onSelect={() => applySuggestion(suggestion)}
                  value={suggestion.value}
                >
                  <SuggestionIcon field={suggestion.field} />
                  <span className="font-mono text-xs">{suggestion.label}</span>
                  <span className="text-muted-foreground">{suggestion.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function QuerySegmentView({ index, segment }: { index: number; segment: QuerySegment }) {
  if (segment.kind === "text") {
    return <span className="text-foreground">{segment.text}</span>;
  }

  return (
    <Badge
      aria-label={`Query condition ${index + 1}: ${segment.negated ? "not " : ""}${segment.field} ${segment.value}`}
      className="max-w-full"
      variant="outline"
    >
      <ConditionIcon field={segment.field} />
      <span className="font-mono text-muted-foreground">
        {segment.negated ? `-${segment.field}` : segment.field}
      </span>
      <span className="min-w-0 max-w-80 truncate">{segment.value}</span>
    </Badge>
  );
}

function DraftQuerySegmentInput({
  disabled,
  draftToken,
  inputId,
  inputRef,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
}: {
  disabled: boolean;
  draftToken: QueryDraftToken;
  inputId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <Badge
      aria-label={`Draft query condition: ${draftToken.negated ? "not " : ""}${draftToken.field}`}
      className="h-auto max-w-full gap-1 py-1 pr-1.5"
      variant="outline"
    >
      <ConditionIcon field={draftToken.field} />
      <span className="font-mono text-muted-foreground">
        {draftToken.negated ? `-${draftToken.field}` : draftToken.field}
      </span>
      <input
        aria-label="Search condition value"
        className="max-w-80 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"
        disabled={disabled}
        id={inputId}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        ref={inputRef}
        style={{ width: `${Math.max(draftToken.value.length, 1)}ch` }}
        value={draftToken.value}
      />
    </Badge>
  );
}

function ConditionIcon({ field }: { field: QueryConditionField }) {
  const Icon = conditionMeta[field].icon;
  return <Icon aria-hidden="true" />;
}

function SuggestionIcon({ field }: { field?: QueryConditionField }) {
  if (!field) {
    return <FileTextIcon aria-hidden="true" />;
  }

  return <ConditionIcon field={field} />;
}

function buildSuggestions(draft: string, lookups: QueryInputSuggestions = {}) {
  const normalizedDraft = draft.trimStart().toLowerCase();

  if (!normalizedDraft) {
    return operatorSuggestions;
  }

  if (normalizedDraft.startsWith("is:")) {
    return stateSuggestions
      .map((state) => ({
        description: "Card state",
        field: "is" as const,
        label: state,
        value: `is:${state}`,
      }))
      .filter((suggestion) => suggestion.value.startsWith(normalizedDraft));
  }

  if (normalizedDraft.startsWith("prop:")) {
    return propertySuggestions
      .map((property) => ({
        description: "Card property",
        field: "prop" as const,
        label: property,
        value: `prop:${property}`,
      }))
      .filter((suggestion) => suggestion.value.startsWith(normalizedDraft));
  }

  const lookupSuggestions = [
    ...(lookups.decks ?? []).map((deck) => lookupSuggestion("deck", deck)),
    ...(lookups.tags ?? []).map((tag) => lookupSuggestion("tag", tag)),
    ...(lookups.noteTypes ?? []).map((noteType) => lookupSuggestion("note", noteType)),
  ].filter((suggestion) => suggestion.value.toLowerCase().startsWith(normalizedDraft));

  return [
    ...lookupSuggestions,
    ...operatorSuggestions.filter((suggestion) => suggestion.value.startsWith(normalizedDraft)),
  ];
}

function lookupSuggestion(field: "deck" | "note" | "tag", value: string): QuerySuggestion {
  return {
    description: `${field} value`,
    field,
    label: value,
    value: `${field}:${quoteValueIfNeeded(value)}`,
  };
}

function quoteValueIfNeeded(value: string) {
  return /\s|"/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

function isCompleteSuggestion(value: string) {
  return value.startsWith("is:") || /^deck:.+|^tag:.+|^note:.+/.test(value);
}

function shouldApplyDraftSuggestion(draft: string, suggestion: QuerySuggestion | undefined) {
  return Boolean(
    suggestion && suggestion.value !== draft && isCompleteSuggestion(suggestion.value),
  );
}

function trimDraft(queryText: string, draft: string) {
  if (!draft || !queryText.endsWith(draft)) {
    return queryText;
  }

  return queryText.slice(0, -draft.length).trim();
}

function documentHasFocus() {
  return typeof document === "undefined" || document.hasFocus();
}

function preventDefault(event: Event) {
  event.preventDefault();
}
