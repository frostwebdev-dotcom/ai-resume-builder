import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepItem = {
  id: string;
  label: string;
};

type StepIndicatorProps = {
  steps: StepItem[];
  currentStepId: string;
  className?: string;
};

/**
 * Horizontal step progress — wraps on narrow screens; keep labels short.
 */
export function StepIndicator({
  steps,
  currentStepId,
  className,
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-1">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStepId;

          return (
            <li key={step.id} className="flex min-w-0 items-center gap-2 sm:gap-3">
              {index > 0 ? (
                <span
                  className={cn(
                    "hidden h-px w-6 shrink-0 sm:inline-block",
                    isComplete || isCurrent ? "bg-brand/40" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors sm:size-7 sm:text-[0.7rem]",
                    isComplete &&
                      "bg-success/12 text-success ring-success/30",
                    isCurrent &&
                      !isComplete &&
                      "bg-brand text-brand-foreground shadow-soft ring-brand/40",
                    !isComplete &&
                      !isCurrent &&
                      "bg-muted/60 text-muted-foreground ring-border",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium transition-colors",
                    isCurrent
                      ? "text-foreground"
                      : isComplete
                        ? "text-foreground/80"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
