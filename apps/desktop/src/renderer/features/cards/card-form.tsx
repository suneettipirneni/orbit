import { useForm } from "react-hook-form";
import { Button } from "@orbit/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orbit/ui/components/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@orbit/ui/components/field";
import { NativeSelect, NativeSelectOption } from "@orbit/ui/components/native-select";
import { Textarea } from "@orbit/ui/components/textarea";
import { useCreateNoteMutation } from "@/lib/mutations/note";

export interface CardFormProps {
  deckId: string;
  deckName: string;
}

interface CardFormValues {
  back: string;
  front: string;
}

export function CardForm({ deckId, deckName }: CardFormProps) {
  "use no memo";

  const form = useForm<CardFormValues>({
    defaultValues: {
      back: "",
      front: "",
    },
  });
  const createCard = useCreateNoteMutation();
  const registerFront = form.register("front");
  const registerBack = form.register("back");
  const submitCardForm = form.handleSubmit((values) => {
    if (values.front.trim() && values.back.trim()) {
      createCard.mutate(
        { ...values, deckId },
        {
          onSuccess: () => {
            form.reset();
          },
        },
      );
    }
  });

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle>Add note</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            void submitCardForm(event);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="note-type">Note type</FieldLabel>
              <FieldContent>
                <NativeSelect id="note-type" value="basic" disabled>
                  <NativeSelectOption value="basic">Basic</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="target-deck">Deck</FieldLabel>
              <FieldContent>
                <NativeSelect id="target-deck" value={deckId} disabled>
                  <NativeSelectOption value={deckId}>{deckName}</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="front">Front</FieldLabel>
              <FieldContent>
                <Textarea id="front" {...registerFront} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="back">Back</FieldLabel>
              <FieldContent>
                <Textarea id="back" {...registerBack} />
              </FieldContent>
            </Field>
          </FieldGroup>
          <Button disabled={createCard.isPending} type="submit">
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
