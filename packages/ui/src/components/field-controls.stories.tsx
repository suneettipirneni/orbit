import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterIcon, SearchIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import { NativeSelect, NativeSelectOption } from "./native-select";
import { Switch } from "./switch";

const meta = {
  title: "Components/Field Controls",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SearchAndFilters: Story = {
  render: () => (
    <form className="grid w-[min(34rem,calc(100vw-2rem))] gap-3" aria-label="Card filters">
      <div className="grid gap-1.5">
        <Label htmlFor="card-search">Search cards</Label>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="card-search"
            name="card-search"
            type="search"
            placeholder="Search decks, tags, or cards..."
            className="pl-8"
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <NativeSelect name="deck" aria-label="Deck">
          <NativeSelectOption>All Decks</NativeSelectOption>
          <NativeSelectOption>USMLE Step 1</NativeSelectOption>
          <NativeSelectOption>Zanki Step 1</NativeSelectOption>
        </NativeSelect>
        <Input name="tag" placeholder="Filter..." aria-label="Tag filter" />
        <Button variant="secondary">
          <FilterIcon data-icon="inline-start" />
          Filters
        </Button>
      </div>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByLabelText("Search cards");

    await userEvent.type(search, "b cells");
    await expect(search).toHaveValue("b cells");
    await expect(canvas.getByRole("button", { name: /filters/i })).toHaveAttribute(
      "type",
      "button",
    );
  },
};

export const Preferences: Story = {
  render: () => (
    <div className="grid w-[min(26rem,calc(100vw-2rem))] gap-4 rounded-lg border border-border bg-card p-4">
      <label className="flex min-w-0 items-center gap-3">
        <Switch aria-label="Sync local media" defaultChecked />
        <span className="min-w-0 text-base sm:text-sm">Sync local media status</span>
      </label>
      <label className="flex min-w-0 items-center gap-3">
        <Checkbox id="bury-related" defaultChecked />
        <span className="min-w-0 text-base sm:text-sm">Bury related cards until tomorrow</span>
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sync = canvas.getByRole("switch", { name: "Sync local media" });
    const bury = canvas.getByRole("checkbox", { name: /bury related/i });

    await expect(sync).toBeChecked();
    await userEvent.click(sync);
    await expect(sync).not.toBeChecked();
    await expect(bury).toBeChecked();
  },
};
