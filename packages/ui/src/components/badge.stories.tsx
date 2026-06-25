import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckCircle2Icon, CircleAlertIcon, SparklesIcon } from "lucide-react";
import { expect, within } from "storybook/test";

import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
        "new",
        "learning",
        "review",
        "suspended",
        "archived",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReviewStatus: Story = {
  args: {
    variant: "review",
    children: "Review",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Review")).toBeVisible();
  },
};

export const StudyStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="new">
        <SparklesIcon data-icon="inline-start" />
        New
      </Badge>
      <Badge variant="learning">Learning</Badge>
      <Badge variant="review">
        <CheckCircle2Icon data-icon="inline-start" />
        Review
      </Badge>
      <Badge variant="suspended">Suspended</Badge>
      <Badge variant="archived">Archived</Badge>
      <Badge variant="destructive">
        <CircleAlertIcon data-icon="inline-start" />
        Missing
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = ["New", "Learning", "Review", "Suspended", "Archived", "Missing"];

    for (const state of states) {
      await expect(canvas.getByText(state)).toBeVisible();
    }
  },
};

export const LinkedTag: Story = {
  render: () => (
    <Badge asChild variant="outline">
      <a href="#immunology">Immunology</a>
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("link", { name: "Immunology" })).toHaveAttribute(
      "href",
      "#immunology",
    );
  },
};
