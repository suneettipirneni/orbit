import type { CardPreview } from "@orbit/types";
import { Play } from "lucide-react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@orbit/ui/components/breadcrumb";
import { Button } from "@orbit/ui/components/button";
import { Separator } from "@orbit/ui/components/separator";
import { SidebarTrigger } from "@orbit/ui/components/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/components/table";
import { PageLayout, PageLayoutContent, PageLayoutHeader } from "@/components/layout/page";
import { formatDueDate } from "@/lib/date-format";
import { useDeckCardsQuery, useDeckQuery } from "@/lib/queries/deck";
import { DeckDetails } from "./deck-details";

export function DeckDetailWorkspace({ deckId }: { deckId: string }) {
  const { data: deck } = useDeckQuery(deckId);
  const { data: [deckCardsPage] = [], isLoading: isDeckCardsLoading } = useDeckCardsQuery(deckId, {
    pageSize: 100,
  });

  if (!deck) {
    return (
      <main className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  return (
    <PageLayout>
      <PageLayoutHeader className="flex h-16 min-w-0 items-center gap-2 px-3 py-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Decks</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block truncate">{deck.deck.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageLayoutHeader>
      <PageLayoutContent className="gap-4">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <DeckDetails key={`${deckId}:${deck.deck.updatedAt}`} deck={deck.deck} />
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to={`/decks/${deckId}/review`}>
                <Play className="size-4" />
                Review
              </Link>
            </Button>
          </div>
        </section>
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-normal">Cards</h2>
              <p className="text-sm text-muted-foreground">
                {deckCardsPage
                  ? `Showing ${deckCardsPage.data.length} of ${deckCardsPage.pagination.total} cards`
                  : "Loading cards..."}
              </p>
            </div>
          </div>
          <DeckCardTable cards={deckCardsPage?.data ?? []} isLoading={isDeckCardsLoading} />
        </section>
      </PageLayoutContent>
    </PageLayout>
  );
}

function DeckCardTable({ cards, isLoading }: { cards: CardPreview[]; isLoading: boolean }) {
  return (
    <div className="min-h-0 overflow-hidden rounded-md border border-border bg-card">
      <div className="max-h-[min(36rem,calc(100vh-18rem))] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Front</TableHead>
              <TableHead>Back</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length > 0 ? (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="max-w-[22rem] align-top">
                    <p className="line-clamp-2 font-medium">{card.front}</p>
                  </TableCell>
                  <TableCell className="max-w-[28rem] align-top text-muted-foreground">
                    <p className="line-clamp-2">{card.back}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    {card.ankiCardType ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {formatDueDate(card.dueAt)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
                  {isLoading ? "Loading cards..." : "No cards in this deck."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
