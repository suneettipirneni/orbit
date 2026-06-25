import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import {
  BookOpenIcon,
  BoxesIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  GraduationCapIcon,
  LibraryBigIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "./field";
import { Input } from "./input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";
import { TooltipProvider } from "./tooltip";

const meta = {
  title: "Components/Sidebar",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const decks = [
  { id: "biochem", name: "USMLE Step 1::Biochemistry", due: 17, active: true },
  { id: "renal", name: "USMLE Step 1::Renal", due: 8, active: false },
  { id: "neuro", name: "Neuroanatomy Lab", due: 3, active: false },
  { id: "micro", name: "Sketchy Micro", due: 0, active: false },
];

function StoryFrame({
  defaultOpen = true,
  variant = "sidebar",
  children,
}: {
  defaultOpen?: boolean;
  variant?: "sidebar" | "floating" | "inset";
  children?: ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        className="min-h-[34rem] bg-background"
        style={
          {
            "--sidebar-width": "17rem",
          } as CSSProperties
        }
      >
        <OrbitSidebar variant={variant} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="text-base font-medium sm:text-sm">Orbit Decks</p>
              <p className="text-xs text-muted-foreground">Isolated sidebar canvas</p>
            </div>
          </header>
          <main className="grid min-h-0 flex-1 place-items-center p-6">
            {children ?? (
              <div className="grid w-[min(34rem,100%)] gap-3 rounded-lg border border-border bg-card p-4">
                <p className="text-base font-medium sm:text-sm">Review Dashboard</p>
                <p className="text-base text-muted-foreground sm:text-sm">
                  Use the trigger, rail, active links, badges, and footer controls without loading
                  the desktop app.
                </p>
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function OrbitSidebar({ variant = "sidebar" }: { variant?: "sidebar" | "floating" | "inset" }) {
  return (
    <Sidebar aria-label="Deck library" collapsible="icon" role="navigation" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Orbit">
              <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCapIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">Orbit</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Study system</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput aria-label="Search decks" placeholder="Search decks..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add library item">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Decks">
                  <LibraryBigIcon />
                  <span>Decks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Browse">
                  <SearchIcon />
                  <span>Browse</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Decks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {decks.map((deck) => (
                <SidebarMenuItem key={deck.id}>
                  <SidebarMenuButton isActive={deck.active} tooltip={deck.name}>
                    <BookOpenIcon />
                    <span>{deck.name}</span>
                  </SidebarMenuButton>
                  {deck.due > 0 ? <SidebarMenuBadge>{deck.due}</SidebarMenuBadge> : null}
                  <SidebarMenuAction aria-label={`Actions for ${deck.name}`} showOnHover>
                    <MoreHorizontalIcon />
                  </SidebarMenuAction>
                  {deck.active ? (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#" isActive>
                          <CheckCircle2Icon />
                          <span>Due today</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#">
                          <CircleDashedIcon />
                          <span>Suspended</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="grid gap-2 group-data-[collapsible=icon]:hidden">
          <Button type="button">
            <UploadIcon />
            Import Anki
          </Button>
          <Button type="button" variant="outline">
            <SettingsIcon />
            Preferences
          </Button>
        </div>
        <form className="grid gap-2 group-data-[collapsible=icon]:hidden">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sidebar-story-deck-name">New deck</FieldLabel>
              <FieldContent className="flex flex-row gap-2">
                <Input id="sidebar-story-deck-name" placeholder="Biology" />
                <Button aria-label="Create deck" size="icon" type="button">
                  <PlusIcon />
                </Button>
              </FieldContent>
            </Field>
          </FieldGroup>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function LoadingSidebar() {
  return (
    <TooltipProvider>
      <SidebarProvider className="min-h-[34rem] bg-background">
        <Sidebar aria-label="Loading deck library" collapsible="none" role="navigation">
          <SidebarHeader>
            <SidebarMenuSkeleton showIcon />
            <SidebarInput aria-label="Search decks" disabled placeholder="Search decks..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Decks</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <main className="grid flex-1 place-items-center p-6">
            <div className="text-base text-muted-foreground sm:text-sm">Loading decks...</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export const DeckLibrary: Story = {
  render: () => <StoryFrame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("navigation", { name: "Deck library" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Decks" })).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(canvas.getByText("USMLE Step 1::Biochemistry")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Import Anki" })).toBeVisible();
  },
};

export const CollapsedIconRail: Story = {
  render: () => <StoryFrame defaultOpen={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]');
    const trigger = canvasElement.querySelector('[data-slot="sidebar-trigger"]');

    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect(canvas.getByRole("navigation", { name: "Deck library" })).toBeVisible();
    await expect(trigger).toBeVisible();
  },
};

export const TriggerInteraction: Story = {
  render: () => <StoryFrame defaultOpen={false} />,
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]');
    const trigger = canvasElement.querySelector('[data-slot="sidebar-trigger"]');

    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger as HTMLElement);
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  },
};

export const FloatingVariant: Story = {
  render: () => (
    <StoryFrame variant="floating">
      <div className="grid w-[min(34rem,100%)] gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <BoxesIcon className="size-4 text-primary" />
          <p className="text-base font-medium sm:text-sm">Floating sidebar variant</p>
        </div>
        <p className="text-base text-muted-foreground sm:text-sm">
          Use this story to inspect rounded, shadowed sidebar chrome against app content.
        </p>
      </div>
    </StoryFrame>
  ),
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]');

    await expect(sidebar).toHaveAttribute("data-variant", "floating");
  },
};

export const InsetVariant: Story = {
  render: () => <StoryFrame variant="inset" />,
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]');

    await expect(sidebar).toHaveAttribute("data-variant", "inset");
  },
};

export const LoadingState: Story = {
  render: () => <LoadingSidebar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("navigation", { name: "Loading deck library" })).toBeVisible();
    await expect(canvas.getAllByText("Loading decks...")).toHaveLength(1);
  },
};
