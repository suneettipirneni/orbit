import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontalIcon } from "lucide-react";
import { expect, within } from "storybook/test";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "./card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

const meta = {
  title: "Components/Data Surface",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const rows = [
  {
    card: "Pathway: Glycolysis",
    due: 7,
    deck: "USMLE Step 1::Biochemistry",
    tag: "biochem",
    state: "review",
  },
  {
    card: "Kaplan: Renin function",
    due: 3,
    deck: "USMLE Step 1::Renal",
    tag: "renal",
    state: "learning",
  },
  {
    card: "FA: Cranial nerve VII",
    due: 1,
    deck: "USMLE Step 1::Neuro",
    tag: "neuro",
    state: "new",
  },
];

export const ReviewTable: Story = {
  render: () => (
    <Card className="w-[min(52rem,calc(100vw-2rem))]">
      <CardHeader>
        <CardTitle>Due Cards</CardTitle>
        <CardAction>
          <Button aria-label="More table actions" size="icon-sm" variant="ghost">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Deck</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Tag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.card}>
                <TableCell className="font-medium">{row.card}</TableCell>
                <TableCell className="tabular-nums">{row.due}</TableCell>
                <TableCell>{row.deck}</TableCell>
                <TableCell>
                  <Badge variant={row.state as "review" | "learning" | "new"}>{row.state}</Badge>
                </TableCell>
                <TableCell>{row.tag}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("table")).toBeVisible();
    await expect(canvas.getAllByRole("columnheader")).toHaveLength(5);
    await expect(canvas.getByRole("button", { name: "More table actions" })).toBeVisible();
    await expect(canvas.getByText("Pathway: Glycolysis")).toBeVisible();
  },
};
