import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-2">
        <h3 className="text-headline text-balance">{title}</h3>
        {description ? (
          <p className="text-body-muted text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex w-full max-w-xs flex-col gap-2">{action}</div> : null}
    </div>
  );
}
