import { BrowserRouter, HashRouter, Route, Routes, useNavigate, useParams } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@orbit/ui/components/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@orbit/ui/components/sidebar";
import { TooltipProvider } from "@orbit/ui/components/tooltip";
import { DeckDetail } from "@/features/decks/deck-detail";
import { DeckList } from "@/features/decks/deck-list";
import { ReviewPanel } from "@/features/reviews/review-panel";

export function App() {
  const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        <Route element={<OrbitShell />} path="/" />
        <Route element={<OrbitShell />} path="/decks/:deckId" />
      </Routes>
    </Router>
  );
}

function OrbitShell() {
  const navigate = useNavigate();
  const { deckId } = useParams();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DeckList
          onSelectDeck={(selectedDeckId) => {
            void navigate(`/decks/${selectedDeckId}`);
          }}
          selectedDeckId={deckId}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{deckId ? "Deck workspace" : "Dashboard"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <DeckDetail deckId={deckId} />
            <ReviewPanel deckId={deckId} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
