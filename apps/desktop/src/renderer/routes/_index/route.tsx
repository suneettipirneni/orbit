import type { DeckSummary } from "@orbit/types";
import { BookOpen, Clock, Layers3 } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@orbit/ui/components/card";
import { useSuspenseDecksQuery } from "@/lib/queries/deck";

const decksPageQueryInput = { pageSize: 100 };

export default function DecksPage() {
  const { data: [decksPage] = [] } = useSuspenseDecksQuery(decksPageQueryInput);
  const deckItems = decksPage?.data ?? [];

  return (
    <>
      {deckItems.length > 0 ? (
        <section
          aria-label="Deck grid"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {deckItems.map((deck) => (
            <DeckGridCard deck={deck} key={deck.id} />
          ))}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-card p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-normal">No decks yet</h2>
            <p className="text-sm text-muted-foreground">
              Create or import a deck from the sidebar.
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function DeckGridCard({ deck }: { deck: DeckSummary }) {
  const dueCards = deck.newCards + deck.learningCards + deck.reviewCards;

  return (
    <Link
      className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      to={`/decks/${deck.id}`}
    >
      <Card className="h-full rounded-lg transition-colors hover:bg-muted/40" size="sm">
        <CardHeader>
          <CardTitle className="flex min-w-0 items-center gap-2">
            <BookOpen className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{deck.name}</span>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {deck.description || "No description."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border text-sm">
            <DeckStat label="New" value={deck.newCards} />
            <DeckStat label="Learn" value={deck.learningCards} />
            <DeckStat label="Review" value={deck.reviewCards} />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers3 className="size-3.5" />
              {deck.totalCards} total
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {dueCards} due
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DeckStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1 border-r border-border p-2 last:border-r-0">
      <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
