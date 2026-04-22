import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Shorter copy next to PDF pricing so “preview” is not repeated in a heading stack. */
  variant?: "default" | "compact";
};

/**
 * Short note near PDF export (or guest preview): on-screen layout vs PDF differences.
 */
export function PdfPreviewFidelityNote({ className, variant = "default" }: Props) {
  const compact = variant === "compact";
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-2 text-[0.8125rem] leading-snug text-muted-foreground",
        className,
      )}
      role="note"
    >
      <Info className="mt-0.5 size-3.5 shrink-0 opacity-80" aria-hidden />
      {compact ? (
        <p>
          The layout you see here is what we generate from. Fonts, wrapping, and page breaks can shift
          slightly in the PDF while the content stays the same.
        </p>
      ) : (
        <p>
          <span className="font-medium text-foreground/90">On-screen preview is the source for export.</span>{" "}
          The PDF is built to match it; fonts, line wrapping, page breaks, and sidebar (two-column) layouts
          can shift a little on the page while the content stays the same.
        </p>
      )}
    </div>
  );
}
