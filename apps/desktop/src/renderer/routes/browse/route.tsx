import { Search } from "lucide-react";
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
import { useDecksQuery } from "@/lib/queries/deck";
import { AddNoteDraftProvider, AddNoteForm } from "../decks.$deckId/add-note-draft-context";
import { DeckCardBrowser } from "../decks.$deckId/deck-card-browser";

export default function BrowsePage() {
  const { data: [decksPage] = [] } = useDecksQuery({ pageSize: 100 });
  const deckItems = decksPage?.data ?? [];
  const defaultDeck = deckItems[0];

  return (
    <AddNoteDraftProvider>
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
                <BreadcrumbPage className="flex items-center gap-2">
                  <Search className="size-4" />
                  Browse
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageLayoutHeader>
        <PageLayoutContent className="gap-4">
          {defaultDeck ? (
            <AddNoteForm
              deckId={defaultDeck.id}
              deckName={defaultDeck.name}
              deckOptions={deckItems}
            />
          ) : null}
          <DeckCardBrowser />
        </PageLayoutContent>
      </PageLayout>
    </AddNoteDraftProvider>
  );
}
