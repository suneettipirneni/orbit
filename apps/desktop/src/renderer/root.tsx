import "./styles.css";
import { PowerSyncContext } from "@powersync/react";
import { Search } from "lucide-react";
import { Suspense, useEffect, type ReactNode } from "react";
import {
  Link,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatch,
} from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@orbit/ui/components/breadcrumb";
import { Separator } from "@orbit/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@orbit/ui/components/sidebar";
import { TooltipProvider } from "@orbit/ui/components/tooltip";
import type { Route } from "./+types/root";
import { DeckList } from "./deck-list";
import { PageLayout, PageLayoutContent, PageLayoutHeader } from "@/components/layout/page";
import { connectPowerSync, powerSync } from "@/lib/powersync";
import { useSuspenseDeckQuery } from "@/lib/queries/deck";

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
  const nestedDeckRoute = useMatch("/decks/:deckId/*");
  const deckRoute = useMatch("/decks/:deckId");
  const activeDeckRoute = nestedDeckRoute ?? deckRoute;
  const reviewRoute = useMatch("/decks/:deckId/review");
  const browseRoute = useMatch("/browse");
  const isElectron = typeof navigator !== "undefined" && navigator.userAgent.includes("Electron/");
  useEffect(() => {
    void connectPowerSync();
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSync}>
      <TooltipProvider>
        <SidebarProvider className={isElectron ? "electron-window" : undefined}>
          <DeckList />
          <SidebarInset>
            <PageLayout>
              <Suspense
                fallback={
                  <RouteFrameFallback
                    deckId={activeDeckRoute?.params.deckId}
                    isBrowse={Boolean(browseRoute)}
                    isReview={Boolean(reviewRoute)}
                  />
                }
              >
                <RouteFrame
                  deckId={activeDeckRoute?.params.deckId}
                  isBrowse={Boolean(browseRoute)}
                  isReview={Boolean(reviewRoute)}
                />
              </Suspense>
            </PageLayout>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </PowerSyncContext.Provider>
  );
}

function RouteFrame({
  deckId,
  isBrowse,
  isReview,
}: {
  deckId?: string;
  isBrowse: boolean;
  isReview: boolean;
}) {
  return (
    <>
      <PageLayoutHeader className="">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <RootBreadcrumbs deckId={deckId} isBrowse={isBrowse} isReview={isReview} />
        </div>
      </PageLayoutHeader>
      <PageLayoutContent className="gap-4">
        <Outlet />
      </PageLayoutContent>
    </>
  );
}

function RouteFrameFallback({
  deckId,
  isBrowse,
  isReview,
}: {
  deckId?: string;
  isBrowse: boolean;
  isReview: boolean;
}) {
  return (
    <>
      <PageLayoutHeader className="">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <RootBreadcrumbsFallback deckId={deckId} isBrowse={isBrowse} isReview={isReview} />
        </div>
      </PageLayoutHeader>
      <PageLayoutContent className="gap-4">
        <PageContentFallback />
      </PageLayoutContent>
    </>
  );
}

function PageContentFallback() {
  return (
    <section className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </section>
  );
}

function RootBreadcrumbsFallback({
  deckId,
  isBrowse,
  isReview,
}: {
  deckId?: string;
  isBrowse: boolean;
  isReview: boolean;
}) {
  if (deckId) {
    return <DeckBreadcrumbsContent deckId={deckId} deckName="Deck" isReview={isReview} />;
  }

  return <RootBreadcrumbs isBrowse={isBrowse} isReview={isReview} />;
}

function RootBreadcrumbs({
  deckId,
  isBrowse,
  isReview,
}: {
  deckId?: string;
  isBrowse: boolean;
  isReview: boolean;
}) {
  if (deckId) {
    return <DeckBreadcrumbs deckId={deckId} isReview={isReview} />;
  }

  if (isBrowse) {
    return (
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
    );
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0 flex-nowrap">
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="block truncate">Decks</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DeckBreadcrumbs({ deckId, isReview }: { deckId: string; isReview: boolean }) {
  const { data: deck } = useSuspenseDeckQuery(deckId);
  const deckName = deck?.deck.name ?? "Deck";

  return <DeckBreadcrumbsContent deckId={deckId} deckName={deckName} isReview={isReview} />;
}

function DeckBreadcrumbsContent({
  deckId,
  deckName,
  isReview,
}: {
  deckId: string;
  deckName: string;
  isReview: boolean;
}) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0 flex-nowrap">
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbLink asChild>
            <Link to="/">Decks</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          {isReview ? (
            <BreadcrumbLink asChild>
              <Link to={`/decks/${deckId}`} className="block truncate">
                {deckName}
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="block truncate">{deckName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {isReview ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block truncate">Review</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
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
