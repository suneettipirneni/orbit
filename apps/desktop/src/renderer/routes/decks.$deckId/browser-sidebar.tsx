import type { DeckSummary } from "@orbit/types";
import { FileTree as PierreFileTree, useFileTree } from "@pierre/trees/react";
import { useEffect, useRef, type RefObject } from "react";

export function BrowserSidebar({
  activeDeckId,
  browserTags,
  decks,
  filter,
  filterRef,
  onActivateDeck,
  onFilterChange,
}: {
  activeDeckId: string;
  browserTags: string[];
  decks: DeckSummary[];
  filter: string;
  filterRef: RefObject<HTMLInputElement | null>;
  onActivateDeck: (deckName: string) => void;
  onFilterChange: (filter: string) => void;
}) {
  const deckPaths = decks.map((deckOption) => deckOption.name);
  const activeDeckPath = decks.find((deckOption) => deckOption.id === activeDeckId)?.name;
  const deckByPath = new Map(decks.map((deckOption) => [deckOption.name, deckOption]));
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleDeckPaths = normalizedFilter
    ? deckPaths.filter((deckPath) => deckPath.toLowerCase().includes(normalizedFilter))
    : deckPaths;

  const deckByPathRef = useRef(deckByPath);
  const { model } = useFileTree({
    fileTreeSearchMode: "hide-non-matches",
    initialSelectedPaths: activeDeckPath ? [activeDeckPath] : [],
    onSelectionChange(selectedPaths) {
      const selectedPath = selectedPaths.at(-1);
      const selectedDeck = selectedPath ? deckByPathRef.current.get(selectedPath) : undefined;

      if (selectedDeck) {
        onActivateDeck(selectedDeck.name);
      }
    },
    paths: deckPaths,
    search: false,
    unsafeCSS: `
      :host {
        --trees-item-height: 30px;
        --trees-fg-override: hsl(var(--foreground));
        --trees-bg-override: transparent;
        --trees-selected-bg-override: hsl(var(--accent));
        --trees-selected-fg-override: hsl(var(--accent-foreground));
      }

      button[data-type='item'] {
        border-radius: 6px;
      }
    `,
  });

  useEffect(() => {
    deckByPathRef.current = deckByPath;
  }, [deckByPath]);

  useEffect(() => {
    model.resetPaths(deckPaths);

    if (activeDeckPath && model.getItem(activeDeckPath)) {
      model.getItem(activeDeckPath)?.select();
    }
  }, [activeDeckPath, deckPaths, model]);

  useEffect(() => {
    model.setSearch(filter.trim() || null);
  }, [filter, model]);

  return (
    <aside
      aria-label="Browser sidebar panel"
      className="grid min-h-0 content-start gap-3 rounded-lg border border-border p-3"
      data-visible-decks={visibleDeckPaths.join("|")}
    >
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-sidebar-filter">
        Filter
        <input
          aria-label="Sidebar filter"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-sidebar-filter"
          onChange={(event) => onFilterChange(event.currentTarget.value)}
          ref={filterRef}
          value={filter}
        />
      </label>
      <PierreFileTree
        aria-label="Browser sidebar"
        className="min-h-40 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        id="browser-sidebar-tree"
        model={model}
        role="tree"
        style={{ height: "240px" }}
        tabIndex={-1}
      />
      <p className="text-sm text-muted-foreground">
        Tag list: {browserTags.length ? browserTags.join(", ") : "none"}
      </p>
    </aside>
  );
}
