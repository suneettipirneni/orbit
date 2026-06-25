import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { MetricItem, MetricStrip } from "./metric-strip";
import { Progress } from "./progress";

const meta = {
  title: "Components/Metric Strip",
  component: MetricStrip,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MetricStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Today: Story = {
  render: () => (
    <MetricStrip className="w-[min(44rem,calc(100vw-2rem))] [--metric-count:5]">
      <MetricItem label="Due" value="128" />
      <MetricItem label="New" value="32" />
      <MetricItem label="Learning" value="24" />
      <MetricItem label="Review" value="72" />
      <MetricItem label="Time" value="45" detail="min" />
    </MetricStrip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Due")).toBeVisible();
    await expect(canvas.getByText("128")).toHaveClass("tabular-nums");
    await expect(canvas.getByText("45")).toBeVisible();
  },
};

export const DeckProgress: Story = {
  render: () => (
    <Card className="w-[min(28rem,calc(100vw-2rem))]">
      <CardHeader>
        <CardTitle>Deck Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {[
            ["USMLE Step 1", 68],
            ["Zanki Step 1", 54],
            ["Anatomy", 42],
          ].map(([deck, progress]) => (
            <div className="grid gap-1.5" key={deck}>
              <div className="flex min-w-0 items-center justify-between gap-3 text-base sm:text-sm">
                <span className="min-w-0 truncate text-foreground">{deck}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{progress}%</span>
              </div>
              <Progress aria-label={`${deck} progress`} value={Number(progress)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Deck Progress")).toBeVisible();
    await expect(canvas.getByRole("progressbar", { name: /usmle step 1/i })).toHaveAttribute(
      "aria-valuenow",
      "68",
    );
  },
};
