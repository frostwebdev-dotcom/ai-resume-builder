import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  hasName: boolean;
  filledCount: number;
  className?: string;
};

export function IncompletePreviewNote({ hasName, filledCount, className }: Props) {
  if (hasName && filledCount >= 2) return null;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-sm text-foreground",
        className,
      )}
      role="status"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">Preview is a draft</p>
        <p className="text-caption leading-relaxed text-muted-foreground">
          {!hasName
            ? "Add your name in the builder so your resume looks complete."
            : "Add a headline, summary, or experience — empty sections stay hidden until you fill them."}
        </p>
      </div>
    </div>
  );
}
