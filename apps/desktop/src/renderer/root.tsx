import "./styles.css";
import { PowerSyncContext } from "@powersync/react";
import { useEffect, type ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatch,
  useNavigate,
} from "react-router";
import { SidebarInset, SidebarProvider } from "@orbit/ui/components/sidebar";
import { TooltipProvider } from "@orbit/ui/components/tooltip";
import type { Route } from "./+types/root";
import { DeckList } from "./deck-list";
import { connectPowerSync, powerSync } from "@/lib/powersync";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Orbit</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const navigate = useNavigate();
  const nestedDeckRoute = useMatch("/decks/:deckId/*");
  const deckRoute = useMatch("/decks/:deckId");
  const activeDeckRoute = nestedDeckRoute ?? deckRoute;
  const isElectron = typeof navigator !== "undefined" && navigator.userAgent.includes("Electron/");
  useEffect(() => {
    void connectPowerSync();
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSync}>
      <TooltipProvider>
        <SidebarProvider className={isElectron ? "electron-window" : undefined}>
          <DeckList
            onSelectDeck={(selectedDeckId) => {
              void navigate(`/decks/${selectedDeckId}`);
            }}
            selectedDeckId={activeDeckRoute?.params.deckId}
          />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </PowerSyncContext.Provider>
  );
}

export function HydrateFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-8 text-foreground">
      <p className="text-sm text-muted-foreground">Loading Orbit...</p>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unexpected error";

  return (
    <main className="grid min-h-screen place-items-center bg-background p-8 text-foreground">
      <section className="grid max-w-md gap-2 rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold tracking-normal">Orbit could not load</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
