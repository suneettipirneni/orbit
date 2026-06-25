import type { Meta, StoryObj } from "@storybook/react-vite";
import { DownloadIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Study Now",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "outline",
        "ghost",
        "tertiary",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PrimaryAction: Story = {
  args: {
    variant: "primary",
    children: "Study Now",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Study Now" });

    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(button).toHaveAttribute("type", "button");
  },
};

export const ActionSet: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">
        <DownloadIcon data-icon="inline-start" />
        Download
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">
        Open App
        <ExternalLinkIcon data-icon="inline-end" />
      </Button>
      <Button aria-label="Create deck" size="icon-sm" variant="ghost">
        <PlusIcon />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: /download/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /open app/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /create deck/i })).toHaveAttribute(
      "aria-label",
      "Create deck",
    );
  },
};

export const DestructiveSecondary: Story = {
  args: {
    variant: "destructive",
    children: "Again",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Again" })).toBeVisible();
  },
};
