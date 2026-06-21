import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@orbit/ui/components/breadcrumb";
import { Separator } from "@orbit/ui/components/separator";
import { SidebarTrigger } from "@orbit/ui/components/sidebar";
import { PageLayout, PageLayoutContent, PageLayoutHeader } from "@/components/layout/page";
import { useDeckQuery, useDecksQuery } from "@/lib/queries/deck";
import {
  AddNoteDraftProvider,
  AddNoteForm,
  useAddNoteDraft,
} from "../decks.$deckId/add-note-draft-context";
import { ReviewPanel } from "../decks.$deckId/review-panel";
import type { Route } from "./+types/route";

export default function DeckReviewPage({ params }: Route.ComponentProps) {
  return (
    <AddNoteDraftProvider>
      <DeckReviewContent deckId={params.deckId} />
    </AddNoteDraftProvider>
  );
}

function DeckReviewContent({ deckId }: { deckId: string }) {
  const { data: deck } = useDeckQuery(deckId);
  const { data: [decksPage] = [] } = useDecksQuery({ pageSize: 100 });
  const { seedAddNoteDraft } = useAddNoteDraft();
  const [isFinished, setIsFinished] = useState(false);
  const deckName = deck?.deck.name ?? "Deck";

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
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/decks/${deckId}`}>{deckName}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block truncate">Review</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageLayoutHeader>
      <PageLayoutContent className="gap-4">
        {isFinished ? (
          <section className="rounded-lg border border-dashed border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold tracking-normal">Review complete</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">No cards are due.</p>
          </section>
        ) : null}
        <ReviewPanel
          deckId={deckId}
          onCreateCopy={(card) => {
            seedAddNoteDraft({
              back: card.back,
              front: card.front,
            });
          }}
          onFinished={() => setIsFinished(true)}
        />
        {deck ? (
          <AddNoteForm
            deckId={deckId}
            deckName={deck.deck.name}
            deckOptions={decksPage?.data ?? []}
          />
        ) : null}
      </PageLayoutContent>
    </PageLayout>
  );
}
