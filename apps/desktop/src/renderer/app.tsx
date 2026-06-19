import {
  BrowserRouter,
  HashRouter,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router";
import { SidebarInset, SidebarProvider } from "@orbit/ui/components/sidebar";
import { TooltipProvider } from "@orbit/ui/components/tooltip";
import { DeckList } from "@/features/decks/deck-list";
import { DeckDetailPage } from "@/pages/deck-detail-page";
import { DecksPage } from "@/pages/decks-page";

export function App() {
  const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        <Route element={<OrbitShell />}>
          <Route element={<DecksPage />} index />
          <Route element={<DeckDetailPage />} path="decks/:deckId" />
        </Route>
      </Routes>
    </Router>
  );
}

function OrbitShell() {
  const navigate = useNavigate();
  const deckRoute = useMatch("/decks/:deckId");
  const isElectron = window.navigator.userAgent.includes("Electron/");

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
