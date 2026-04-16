"use client";

import { cn } from "@/lib/utils";

type Score = 0 | 1 | 2 | 3 | 4;

function scorePassword(pwd: string): Score {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  // Bonus for a symbol (doesn't exceed 4)
  if (/[^A-Za-z0-9]/.test(pwd) && score < 4) score += 1;
  if (score > 4) score = 4;
  return score as Score;
}

const SCORE_LABEL: Record<Score, string> = {
  0: "Too short",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const SCORE_TONE: Record<Score, string> = {
  0: "text-muted-foreground",
  1: "text-destructive",
  2: "text-warning-foreground",
  3: "text-info",
  4: "text-success",
};

const SEGMENT_FILL: Record<Score, string> = {
  0: "bg-muted",
  1: "bg-destructive",
  2: "bg-warning",
  3: "bg-info",
  4: "bg-success",
};

type PasswordStrengthProps = {
  value: string;
  /** Optional minimum length hint shown when too short. */
  minLength?: number;
  className?: string;
};

/**
 * Four-segment strength meter for new-password fields.
 * Purely visual; does not enforce policy — server validation is the source of truth.
 */
export function PasswordStrength({
  value,
  minLength = 8,
  className,
}: PasswordStrengthProps) {
  const score = scorePassword(value);
  const label = SCORE_LABEL[score];
  const hint =
    score === 0 && value.length > 0
      ? `Use at least ${minLength} characters`
      : null;

  return (
    <div
      className={cn("space-y-1.5", className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="grid grid-cols-4 gap-1.5"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-valuetext={label}
      >
        {[1, 2, 3, 4].map((seg) => {
          const filled = score >= seg;
          return (
            <span
              key={seg}
              className={cn(
                "h-1 rounded-full transition-colors",
                filled ? SEGMENT_FILL[score] : "bg-border",
              )}
            />
          );
        })}
      </div>
      <p className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", SCORE_TONE[score])}>
          {value ? label : "Password strength"}
        </span>
        {hint ? (
          <span className="text-muted-foreground">{hint}</span>
        ) : null}
      </p>
    </div>
  );
}
