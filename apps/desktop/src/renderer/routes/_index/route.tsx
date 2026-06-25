import type { CSSProperties } from "react";
import type { DeckSummary } from "@orbit/types";
import { Activity, CalendarDays, Check, Flame, Play } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@orbit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@orbit/ui/components/card";
import { MetricItem, MetricStrip } from "@orbit/ui/components/metric-strip";
import { Progress } from "@orbit/ui/components/progress";
import { useSuspenseDecksQuery } from "@/lib/queries/deck";
import {
  useSuspenseRecentReviewActivityQuery,
  useSuspenseReviewHeatmapQuery,
  useSuspenseTodayStudySummaryQuery,
  useSuspenseUpcomingReviewDaysQuery,
} from "@/lib/queries/review";
import type {
  RecentReviewActivityItem,
  ReviewHeatmapDay,
  UpcomingReviewDay,
} from "@/lib/repo/review";

const decksPageQueryInput = { pageSize: 100 };
const upcomingDayCount = 7;
const heatmapDayCount = 84;

export default function OverviewPage() {
  const { data: [decksPage] = [] } = useSuspenseDecksQuery(decksPageQueryInput);
  const { data: todaySummary } = useSuspenseTodayStudySummaryQuery();
  const { data: upcomingDays } = useSuspenseUpcomingReviewDaysQuery({ days: upcomingDayCount });
  const { data: heatmapDays } = useSuspenseReviewHeatmapQuery({ days: heatmapDayCount });
  const { data: recentActivity } = useSuspenseRecentReviewActivityQuery({ limit: 5 });
  const decks = decksPage?.data ?? [];
  const totals = getOverviewTotals(decks);
  const studyDeck = decks.find((deck) => deck.dueCards > 0) ?? decks[0];
  const estimatedMinutes = Math.max(0, Math.ceil(totals.due * 0.5));

  return (
    <div className="grid min-w-0 gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-normal">Today</h1>
          <p className="text-sm text-muted-foreground">
            {todaySummary?.studiedCards ?? 0} cards studied today
            {todaySummary?.elapsedSeconds
              ? ` in ${formatDuration(todaySummary.elapsedSeconds)}`
              : ""}
          </p>
        </div>
        {studyDeck ? (
          <Button asChild>
            <Link to={`/decks/${studyDeck.id}/review`}>
              <Play className="size-4" />
              Study Now
            </Link>
          </Button>
        ) : (
          <Button disabled type="button">
            <Play className="size-4" />
            Study Now
          </Button>
        )}
      </section>

      <MetricStrip style={{ "--metric-count": 5 } as CSSProperties}>
        <MetricItem detail="cards" label="Due" value={totals.due} />
        <MetricItem detail="cards" label="New" value={totals.newCards} />
        <MetricItem detail="cards" label="Learning" value={totals.learningCards} />
        <MetricItem detail="cards" label="Review" value={totals.reviewCards} />
        <MetricItem detail="min" label="Time Estimate" value={estimatedMinutes} />
      </MetricStrip>

      <DeckProgressPanel decks={decks} />

      <section className="grid gap-4 lg:grid-cols-2">
        <UpcomingPanel days={upcomingDays} />
        <HeatmapPanel days={heatmapDays} />
      </section>

      <RecentActivityPanel activity={recentActivity} />
    </div>
  );
}

function DeckProgressPanel({ decks }: { decks: DeckSummary[] }) {
  const visibleDecks = [...decks]
    .sort((a, b) => b.dueCards - a.dueCards || a.name.localeCompare(b.name))
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck Progress</CardTitle>
        <CardDescription>Current study load by deck.</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleDecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Deck</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 pr-3 font-medium">New</th>
                  <th className="py-2 pr-3 font-medium">Learning</th>
                  <th className="py-2 pr-3 font-medium">Review</th>
                  <th className="py-2 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {visibleDecks.map((deck) => {
                  const progress = getDeckProgress(deck);

                  return (
                    <tr className="border-b last:border-b-0" key={deck.id}>
                      <td className="py-2 pr-3 font-medium">
                        <Link className="hover:underline" to={`/decks/${deck.id}`}>
                          {deck.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{deck.dueCards}</td>
                      <td className="py-2 pr-3 tabular-nums">{deck.newCards}</td>
                      <td className="py-2 pr-3 tabular-nums">{deck.learningCards}</td>
                      <td className="py-2 pr-3 tabular-nums">{deck.reviewCards}</td>
                      <td className="py-2">
                        <div className="flex min-w-36 items-center gap-2">
                          <Progress aria-label={`${deck.name} progress`} value={progress} />
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel text="Create or import a deck from the sidebar." title="No decks yet" />
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPanel({ days }: { days: UpcomingReviewDay[] }) {
  const chartDays = fillUpcomingDays(days, upcomingDayCount);
  const maxDueCards = Math.max(1, ...chartDays.map((day) => day.dueCards));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          Upcoming
        </CardTitle>
        <CardDescription>Next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid h-48 grid-cols-7 items-end gap-2 border-b border-l border-border px-2 pt-3">
          {chartDays.map((day) => (
            <div className="grid h-full content-end gap-2" key={day.date}>
              <div
                aria-label={`${day.label}: ${day.dueCards} cards due`}
                className="min-h-1 rounded-t-sm bg-primary/70"
                style={{ height: `${Math.max(4, (day.dueCards / maxDueCards) * 100)}%` }}
                title={`${day.label}: ${day.dueCards}`}
              />
              <span className="text-center text-[0.6875rem] text-muted-foreground">
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapPanel({ days }: { days: ReviewHeatmapDay[] }) {
  const heatmapDays = fillTrailingDays(days, heatmapDayCount);
  const maxReviews = Math.max(1, ...heatmapDays.map((day) => day.reviews));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-muted-foreground" />
          Review Heatmap
        </CardTitle>
        <CardDescription>Last 12 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
          {heatmapDays.map((day) => (
            <div
              aria-label={`${formatShortDate(day.date)}: ${day.reviews} reviews`}
              className="size-3 rounded-[2px] bg-muted"
              key={day.date}
              style={{
                backgroundColor:
                  day.reviews > 0
                    ? `color-mix(in oklab, var(--primary) ${Math.max(25, (day.reviews / maxReviews) * 100)}%, var(--muted))`
                    : undefined,
              }}
              title={`${formatShortDate(day.date)}: ${day.reviews}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityPanel({ activity }: { activity: RecentReviewActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link to="/browse">View All</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {activity.length > 0 ? (
          <ol className="grid gap-3">
            {activity.map((item) => (
              <li className="flex items-start justify-between gap-3" key={item.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.front}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.deckName} · {formatDuration(item.elapsedSeconds)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatRelativeDate(item.createdAt)}</span>
                  <Check className="size-4 text-primary" />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyPanel text="Completed reviews will appear here." title="No review activity" />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ text, title }: { text: string; title: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border p-6 text-center">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function getOverviewTotals(decks: DeckSummary[]) {
  return decks.reduce(
    (totals, deck) => ({
      due: totals.due + deck.dueCards,
      learningCards: totals.learningCards + deck.learningCards,
      newCards: totals.newCards + deck.newCards,
      reviewCards: totals.reviewCards + deck.reviewCards,
      totalCards: totals.totalCards + deck.totalCards,
    }),
    {
      due: 0,
      learningCards: 0,
      newCards: 0,
      reviewCards: 0,
      totalCards: 0,
    },
  );
}

function getDeckProgress(deck: DeckSummary) {
  if (deck.totalCards <= 0) {
    return 0;
  }

  return Math.round((deck.reviewCards / deck.totalCards) * 100);
}

function fillUpcomingDays(days: UpcomingReviewDay[], count: number) {
  const dueByDate = new Map(days.map((day) => [day.date, day.dueCards]));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      dueCards: dueByDate.get(dateKey) ?? 0,
      label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
    };
  });
}

function fillTrailingDays(days: ReviewHeatmapDay[], count: number) {
  const reviewsByDate = new Map(days.map((day) => [day.date, day.reviews]));
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - count + 1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      reviews: reviewsByDate.get(dateKey) ?? 0,
    };
  });
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.round(seconds / 60)}m`;
}

function formatRelativeDate(value: string) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const elapsedDays = Math.floor((Date.now() - timestamp) / 86_400_000);

  if (elapsedDays <= 0) {
    return "Today";
  }

  if (elapsedDays === 1) {
    return "Yesterday";
  }

  return `${elapsedDays} days ago`;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
