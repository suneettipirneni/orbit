import { cn } from "@orbit/ui";
import { ComponentProps } from "react";

export function PageLayoutHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={cn("flex w-full border-b h-16 shrink-0 items-center", className)}
    />
  );
}

export function PageLayout({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      className={cn("flex h-screen max-h-screen min-w-0 flex-col overflow-auto", className)}
      {...props}
    />
  );
}

export function PageLayoutContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-w-0 grow flex-col max-h-full max-w-full overflow-auto p-3",
        className,
      )}
      {...props}
    />
  );
}
