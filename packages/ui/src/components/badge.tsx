import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@orbit/ui/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.75rem] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground ring-1 ring-foreground/10 [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-input text-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "text-foreground [a]:hover:bg-muted [a]:hover:text-foreground dark:[a]:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        new: "bg-accent text-primary ring-1 ring-primary/15",
        learning:
          "bg-[color-mix(in_oklab,var(--chart-3),white_82%)] text-[color-mix(in_oklab,var(--chart-3),black_28%)] ring-1 ring-[color-mix(in_oklab,var(--chart-3),transparent_70%)]",
        review:
          "bg-[color-mix(in_oklab,var(--chart-2),white_82%)] text-[color-mix(in_oklab,var(--chart-2),black_36%)] ring-1 ring-[color-mix(in_oklab,var(--chart-2),transparent_70%)]",
        suspended: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
        archived: "bg-background text-muted-foreground ring-1 ring-input",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
