import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** When true, use a denser frame (e.g. mobile layout). */
  compactFrame?: boolean;
};

/**
 * Responsive frame around the resume “paper”. Templates use print widths; this keeps the canvas readable on phones.
 */
export function PreviewViewport({ children, className, compactFrame }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-gradient-to-b from-muted/50 to-muted/20 shadow-inner ring-1 ring-foreground/5",
        compactFrame ? "p-2 sm:p-4" : "p-3 sm:p-6",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full touch-pan-x overflow-x-auto",
          "supports-[overflow:clip]:overflow-x-clip",
        )}
      >
        <div className="mx-auto flex min-w-0 justify-center print:block">{children}</div>
      </div>
    </div>
  );
}
