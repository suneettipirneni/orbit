import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BellIcon, CheckIcon, DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent } from "./card";

const meta = {
  title: "Orbit UI/Transitions",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const waitForTransition = (duration = 300) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });

function DigitGroup({ value }: { value: number }) {
  const chars = String(value).split("");

  return (
    <span
      aria-label={String(value)}
      className="t-digit-group is-animating tabular-nums"
      key={value}
    >
      {chars.map((char, index) => {
        const stagger =
          index === chars.length - 2 ? "1" : index === chars.length - 1 ? "2" : undefined;

        return (
          <span
            aria-hidden="true"
            className="t-digit"
            data-stagger={stagger}
            key={`${char}-${index}`}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

function NumberPopInDemo() {
  const [due, setDue] = React.useState(128);

  return (
    <Card className="w-64">
      <CardContent className="grid gap-3">
        <div>
          <p className="text-base text-muted-foreground sm:text-sm">Due</p>
          <p className="text-3xl font-medium">
            <DigitGroup value={due} />
          </p>
        </div>
        <Button onClick={() => setDue((value) => value + 7)} variant="secondary">
          Update count
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationBadgeDemo() {
  const [open, setOpen] = React.useState(true);

  return (
    <Button
      aria-label="Toggle import notifications"
      onClick={() => setOpen((value) => !value)}
      size="icon-lg"
      variant="secondary"
    >
      <BellIcon />
      <span className="t-badge" data-open={open ? "true" : "false"}>
        <span className="t-badge-dot rounded-full bg-destructive px-1.5 text-[0.6875rem] font-medium text-white">
          3
        </span>
      </span>
    </Button>
  );
}

function IconSwapDemo() {
  const [complete, setComplete] = React.useState(false);

  return (
    <Button
      onClick={() => setComplete((value) => !value)}
      variant={complete ? "primary" : "secondary"}
    >
      <span className="t-icon-swap" data-state={complete ? "b" : "a"} data-icon="inline-start">
        <span className="t-icon" data-icon="a">
          <LoaderCircleIcon className="animate-spin" />
        </span>
        <span className="t-icon" data-icon="b">
          <CheckIcon />
        </span>
      </span>
      {complete ? "Imported" : "Importing"}
    </Button>
  );
}

function SkeletonRevealDemo() {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div className="grid gap-3">
      <div
        className={`t-skel h-20 w-80 ${revealed ? "is-revealed" : ""}`}
        data-state={revealed ? "ready" : "loading"}
      >
        <div className="t-skel-skeleton is-pulsing grid gap-2 rounded-lg border border-border bg-card p-4">
          <div className="h-3 w-44 rounded-full bg-muted" />
          <div className="h-3 w-64 rounded-full bg-muted" />
          <div className="h-3 w-28 rounded-full bg-muted" />
        </div>
        <div className="t-skel-content rounded-lg border border-border bg-card p-4">
          <p className="text-base font-medium sm:text-sm">Media check completed</p>
          <p className="mt-1 text-base text-muted-foreground sm:text-sm">
            3,177 found, 12 missing, 32 duplicates
          </p>
        </div>
      </div>
      <Button onClick={() => setRevealed((value) => !value)} variant="secondary">
        {revealed ? "Reset" : "Reveal"}
      </Button>
    </div>
  );
}

function SlidingTabsDemo() {
  const tabs = ["Decks", "Browser", "Preview"] as const;
  const [selected, setSelected] = React.useState<(typeof tabs)[number]>("Decks");
  const barRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;

    if (!bar || !pill) {
      return;
    }

    const moveToSelected = (animate: boolean) => {
      const tab = bar.querySelector<HTMLButtonElement>('.t-tab[aria-selected="true"]');

      if (!tab) {
        return;
      }

      if (!animate) {
        const prev = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
        void pill.offsetWidth;
        pill.style.transition = prev;
        return;
      }

      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    };

    moveToSelected(false);
    const handleResize = () => moveToSelected(false);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selected]);

  return (
    <div className="grid justify-items-center gap-3">
      <div className="t-tabs" ref={barRef} role="tablist">
        <span aria-hidden="true" className="t-tabs-pill" ref={pillRef} />
        {tabs.map((tab) => (
          <button
            aria-selected={selected === tab}
            className="t-tab text-base font-medium sm:text-sm"
            key={tab}
            onClick={() => setSelected(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <Badge variant="secondary">{selected}</Badge>
    </div>
  );
}

function TooltipDemo() {
  return (
    <span className="t-tt-wrap">
      <Button
        aria-describedby="download-tooltip"
        aria-label="Download deck"
        className="t-tt-trigger"
        size="icon-lg"
        variant="secondary"
      >
        <DownloadIcon />
      </Button>
      <span className="t-tt text-base sm:text-sm" id="download-tooltip" role="tooltip">
        Download deck package
      </span>
    </span>
  );
}

export const NumberPopIn: Story = {
  render: () => <NumberPopInDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText("128")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Update count" }));
    await expect(canvas.getByLabelText("135")).toBeVisible();
  },
};

export const NotificationBadge: Story = {
  render: () => <NotificationBadgeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Toggle import notifications" });

    await expect(canvas.getByText("3")).toBeVisible();
    await userEvent.click(button);
    await expect(canvas.getByText("3").closest(".t-badge")).toHaveAttribute("data-open", "false");
  },
};

export const IconSwap: Story = {
  render: () => <IconSwapDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: "Importing" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Importing" }));
    await expect(canvas.getByRole("button", { name: "Imported" })).toBeVisible();
  },
};

export const SkeletonReveal: Story = {
  render: () => <SkeletonRevealDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Reveal" }));
    await waitForTransition(450);
    await expect(canvas.getByText("Media check completed")).toBeVisible();
  },
};

export const SlidingTabs: Story = {
  render: () => <SlidingTabsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("tab", { name: "Browser" }));
    await expect(canvas.getByRole("tab", { name: "Browser" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

export const Tooltip: Story = {
  render: () => <TooltipDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Download deck" });

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(canvas.getByRole("tooltip")).toHaveTextContent("Download deck package");
  },
};
