import { Outlet, useMatch, useNavigate } from "react-router";
import { SidebarInset, SidebarProvider } from "@orbit/ui/components/sidebar";
import { TooltipProvider } from "@orbit/ui/components/tooltip";
import { DeckList } from "@/features/decks/deck-list";

export default function OrbitShell() {
  const navigate = useNavigate();
  const deckRoute = useMatch("/decks/:deckId");
  const isElectron = typeof navigator !== "undefined" && navigator.userAgent.includes("Electron/");

  return (
    <TooltipProvider>
      <SidebarProvider className={isElectron ? "electron-window" : undefined}>
        <DeckList
          onSelectDeck={(selectedDeckId) => {
            void navigate(`/decks/${selectedDeckId}`);
          }}
          selectedDeckId={deckRoute?.params.deckId}
        />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
