import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** When true, use a denser frame (e.g. mobile layout). Ignored when `presentation` is `document`. */
  compactFrame?: boolean;
  /**
   * When true, do not add an inner horizontal scroller on the resume canvas.
   * Use when the parent manages overflow (e.g. fit-to-panel + zoom in studio).
   */
  clipCanvas?: boolean;
  /**
   * `framed` — gradient inset canvas (marketing / project preview).
   * `document` — minimal chrome so the template reads like a real printed sheet (studio).
   */
  presentation?: "framed" | "document";
};

/**
 * Responsive frame around the resume “paper”. Templates use print widths; this keeps the canvas readable on phones.
 */
export function PreviewViewport({
  children,
  className,
  compactFrame,
  clipCanvas,
  presentation = "framed",
}: Props) {
  if (presentation === "document") {
    return (
      <div className="w-full">
        <div
          className={cn(
            "mx-auto w-full max-w-[210mm] touch-pan-x overflow-hidden rounded-sm",
            "bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)] ring-1 ring-slate-300/55",
            className,
          )}
        >
          <div
            className={cn(
              "mx-auto w-full",
              clipCanvas
                ? "overflow-x-clip overflow-y-clip supports-[overflow:clip]:overflow-clip"
                : ["overflow-x-auto", "supports-[overflow:clip]:overflow-x-clip"],
            )}
          >
            <div className="mx-auto flex min-w-0 justify-center print:block">{children}</div>
          </div>
        </div>
      </div>
    );
  }

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
          "mx-auto w-full touch-pan-x",
          clipCanvas
            ? "overflow-x-clip overflow-y-clip supports-[overflow:clip]:overflow-clip"
            : ["overflow-x-auto", "supports-[overflow:clip]:overflow-x-clip"],
        )}
      >
        <div className="mx-auto flex min-w-0 justify-center print:block">{children}</div>
      </div>
    </div>
  );
}
