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
      <ol className="flex flex-wrap gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStepId;

          return (
            <li key={step.id} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span
                  className="hidden text-muted-foreground sm:inline"
                  aria-hidden
                >
                  /
                </span>
              ) : null}
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-7 sm:text-[0.7rem]",
                    isComplete &&
                      "border-success/40 bg-success/10 text-success",
                    isCurrent &&
                      !isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    !isComplete &&
                      !isCurrent &&
                      "border-border bg-muted/60 text-muted-foreground",
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
                    "truncate text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
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
