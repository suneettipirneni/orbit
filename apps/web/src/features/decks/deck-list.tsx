import type { DeckSummary } from "@orbit/api";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, LibraryBig, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@orbit/ui/components/button";
import { Input } from "@orbit/ui/components/input";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@orbit/ui/components/field";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@orbit/ui/components/sidebar";
import { useCreateDeckMutation, useImportAnkiDecksMutation } from "@/lib/mutations/deck";
import { decksQueryOptions } from "@/lib/queries/deck";

const ankiImportAccept = ".apkg,.colpkg,.anki2,.anki21,application/zip,application/octet-stream";

export interface DeckListProps {
  onSelectDeck: (deckId: string) => void;
  selectedDeckId?: string;
}

interface DeckFormValues {
  name: string;
}

export function DeckList({ onSelectDeck, selectedDeckId }: DeckListProps) {
  "use no memo";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string>();
  const form = useForm<DeckFormValues>({
    defaultValues: {
      name: "",
    },
  });
  const decks = useQuery(decksQueryOptions());
  const registerName = form.register("name");
  const createDeck = useCreateDeckMutation();
  const importAnkiDecks = useImportAnkiDecksMutation();
  const submitDeckForm = form.handleSubmit((values) => {
    if (values.name.trim()) {
      createDeck.mutate(values, {
        onSuccess: (deck) => {
          form.reset();
          onSelectDeck(deck.id);
        },
      });
    }
  });
  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setImportError(undefined);
    importAnkiDecks.mutate(
      { file },
      {
        onError(error) {
          setImportError(error instanceof Error ? error.message : "Anki import failed.");
        },
        onSuccess(result) {
          const firstDeck = result.decks[0];

          if (firstDeck) {
            onSelectDeck(firstDeck.id);
          }
        },
      },
    );
    event.currentTarget.value = "";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Orbit">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LibraryBig className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Orbit</span>
                <span className="truncate text-xs text-muted-foreground">Decks and reviews</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Decks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(decks.data ?? []).map((deck) => (
                <DeckMenuItem
                  deck={deck}
                  isActive={deck.id === selectedDeckId}
                  key={deck.id}
                  onSelectDeck={onSelectDeck}
                />
              ))}
              {decks.data?.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-3 text-sm text-muted-foreground">No decks yet.</div>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="grid gap-2 group-data-[collapsible=icon]:hidden">
          <input
            accept={ankiImportAccept}
            className="hidden"
            onChange={handleImportFileChange}
            ref={fileInputRef}
            type="file"
          />
          <Button
            disabled={importAnkiDecks.isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-4" />
            {importAnkiDecks.isPending ? "Importing..." : "Import Anki"}
          </Button>
          {importError ? <p className="text-xs text-destructive">{importError}</p> : null}
        </div>
        <form
          className="grid gap-2 group-data-[collapsible=icon]:hidden"
          onSubmit={(event) => {
            void submitDeckForm(event);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deck-name">New deck</FieldLabel>
              <FieldContent className="flex flex-row gap-2">
                <Input id="deck-name" placeholder="Biology" {...registerName} />
                <Button aria-label="Create deck" size="icon" type="submit">
                  <Plus className="size-4" />
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

function DeckMenuItem({
  deck,
  isActive,
  onSelectDeck,
}: {
  deck: DeckSummary;
  isActive: boolean;
  onSelectDeck: (deckId: string) => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => onSelectDeck(deck.id)}
        tooltip={deck.name}
        type="button"
      >
        <BookOpen className="size-4" />
        <span>{deck.name}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge>{deck.dueCards}</SidebarMenuBadge>
    </SidebarMenuItem>
  );
}
