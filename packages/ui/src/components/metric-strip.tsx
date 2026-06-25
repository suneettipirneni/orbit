import * as React from "react";

import { cn } from "@orbit/ui/lib/utils";

type MetricStripProps = React.ComponentProps<"dl">;

type MetricItemProps = React.ComponentProps<"div"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
};

function MetricStrip({ className, ...props }: MetricStripProps) {
  return (
    <dl
      data-slot="metric-strip"
      className={cn(
        "grid overflow-hidden rounded-lg border border-border bg-card text-card-foreground sm:grid-cols-[repeat(var(--metric-count,5),minmax(0,1fr))]",
        className,
      )}
      {...props}
    />
  );
}

function MetricItem({ className, label, value, detail, ...props }: MetricItemProps) {
  return (
    <div
      data-slot="metric-item"
      className={cn(
        "min-w-0 border-t border-border p-3 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0",
        className,
      )}
      {...props}
    >
      <dt className="truncate text-base text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="mt-1 flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-2xl font-medium tabular-nums text-foreground sm:text-xl">
          {value}
        </span>
        {detail ? (
          <span className="min-w-0 truncate text-base text-muted-foreground sm:text-sm">
            {detail}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

export { MetricItem, MetricStrip };
