"use client";

import { AlertCircle, CheckCircle2, CloudAlert, CloudCheck, Loader2 } from "lucide-react";

import type { SaveStatus } from "@/hooks/use-wizard-autosave";
import { cn } from "@/lib/utils";

export type AutosaveContext = "guestDevice" | "project";

type Props = {
  context: AutosaveContext;
  status: SaveStatus;
  lastError: string | null;
  onRetry: () => void;
  /** True when the editor differs from the last successful save snapshot. */
  isDirty?: boolean;
  /** Dark chrome (e.g. guest `/create` header) — higher-contrast chip colors. */
  surface?: "light" | "dark";
  /**
   * `toolbar`: inline beside nav (e.g. Home on `/create`) — compact height, no full-width stretch.
   */
  layout?: "default" | "toolbar";
  /** Icon only (e.g. beside draft title on `/build`) — full meaning via `title` + `aria-label`. */
  iconOnly?: boolean;
  className?: string;
};

/**
 * Single autosave indicator for guest (local) and signed-in (project) drafts.
 * Uses one `role="status"` live region so changes are announced without a second hidden copy.
 */
export function AutosaveStatusChip({
  context,
  status,
  lastError,
  onRetry,
  isDirty = false,
  surface = "light",
  layout = "default",
  iconOnly = false,
  className,
}: Props) {
  const toolbar = layout === "toolbar";
  const idleSuffix = context === "guestDevice" ? "this device" : "project";
  const idlePhrase = `Autosave on · ${idleSuffix}`;
  const dark = surface === "dark";

  const unsavedHint =
    context === "guestDevice"
      ? "Unsaved changes — will save to this device."
      : "Unsaved changes — will sync to your project.";

  const iconShell =
    "inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset";

  const baseChip = cn(
    "inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight ring-1 ring-inset",
    toolbar
      ? "h-8 min-h-8 sm:min-h-8 sm:px-2.5 sm:py-0 sm:text-[0.6875rem] sm:leading-tight"
      : "min-h-8 sm:min-h-9 sm:px-2.5 sm:py-1 sm:text-xs sm:leading-normal",
  );

  const showUnsaved = isDirty && status !== "saving" && status !== "error";

  if (iconOnly) {
    const idleTitle =
      context === "guestDevice"
        ? "Autosave on · this device — changes save in this browser only."
        : "Autosave on · project — changes save automatically.";
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn("flex shrink-0 items-center", className)}
      >
        {status === "saving" ? (
          <span
            className={cn(
              iconShell,
              dark ? "bg-white/10 text-slate-100 ring-white/20" : "bg-muted/60 text-muted-foreground ring-border",
            )}
            title="Saving…"
            aria-label="Saving your draft"
          >
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          </span>
        ) : null}
        {showUnsaved ? (
          <span
            className={cn(
              iconShell,
              dark
                ? "bg-amber-400/15 text-amber-100 ring-amber-300/35"
                : "bg-amber-500/12 text-amber-900 ring-amber-600/25 dark:text-amber-100",
            )}
            title={unsavedHint}
            aria-label={unsavedHint}
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden />
          </span>
        ) : null}
        {status === "saved" && !showUnsaved ? (
          <span
            className={cn(
              iconShell,
              dark
                ? "bg-emerald-400/15 text-emerald-100 ring-emerald-300/35"
                : "bg-success/12 text-success ring-success/25",
            )}
            title="Saved"
            aria-label="Draft saved"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          </span>
        ) : null}
        {status === "error" ? (
          <button
            type="button"
            onClick={onRetry}
            title={lastError ? `Couldn't save: ${lastError}. Click to retry.` : "Couldn't save. Click to retry."}
            aria-label={
              lastError
                ? `Couldn't save: ${lastError}. Activate to retry.`
                : "Couldn't save. Activate to retry."
            }
            className={cn(
              iconShell,
              "cursor-pointer transition-colors",
              dark
                ? "bg-red-400/15 text-red-100 ring-red-300/40 hover:bg-red-400/25"
                : "bg-destructive/12 text-destructive ring-destructive/25 hover:bg-destructive/20",
            )}
          >
            <CloudAlert className="size-4 shrink-0" aria-hidden />
          </button>
        ) : null}
        {status === "idle" && !showUnsaved ? (
          <span
            className={cn(
              iconShell,
              dark ? "bg-sky-400/15 text-sky-100 ring-sky-300/35" : "bg-brand-muted text-brand ring-brand/15",
            )}
            title={idleTitle}
            aria-label={idlePhrase}
          >
            <CloudCheck className="size-4 shrink-0" aria-hidden />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "flex min-w-0",
        toolbar ? "w-auto shrink justify-start" : "w-full justify-center sm:justify-end",
        className,
      )}
    >
      {status === "saving" ? (
        <span
          className={cn(
            baseChip,
            dark
              ? "bg-white/10 text-slate-100 ring-white/20"
              : "bg-muted/60 text-muted-foreground ring-border",
          )}
        >
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          Saving…
        </span>
      ) : null}
      {showUnsaved ? (
        <span
          className={cn(
            baseChip,
            "text-balance",
            dark
              ? "bg-amber-400/15 text-amber-50 ring-amber-300/40"
              : "bg-amber-500/12 text-amber-950 ring-amber-600/20 dark:text-amber-50",
          )}
          title={unsavedHint}
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          Unsaved changes
        </span>
      ) : null}
      {status === "saved" && !showUnsaved ? (
        <span
          className={cn(
            baseChip,
            dark
              ? "bg-emerald-400/15 text-emerald-100 ring-emerald-300/35"
              : "bg-success/12 text-success ring-success/25",
          )}
        >
          <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          Saved
        </span>
      ) : null}
      {status === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          title={lastError ?? undefined}
          aria-label={
            lastError
              ? `Couldn't save: ${lastError}. Activate to retry.`
              : "Couldn't save. Activate to retry."
          }
          className={cn(
            baseChip,
            "cursor-pointer transition-colors",
            dark
              ? "bg-red-400/15 text-red-100 ring-red-300/40 hover:bg-red-400/25"
              : "bg-destructive/12 text-destructive ring-destructive/25 hover:bg-destructive/20",
          )}
        >
          <CloudAlert className="size-3.5 shrink-0" aria-hidden />
          Couldn&apos;t save—retry
        </button>
      ) : null}
      {status === "idle" && !showUnsaved ? (
        <span
          className={cn(
            baseChip,
            "text-balance",
            dark
              ? "bg-sky-400/15 text-sky-100 ring-sky-300/35"
              : "bg-brand-muted text-brand ring-brand/15",
          )}
          title={
            context === "guestDevice"
              ? "Changes save in this browser only until you sign in."
              : "Changes save to your project automatically."
          }
        >
          <CloudCheck className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 max-w-[9rem] truncate sm:max-w-none">
            {toolbar ? (
              <>
                <span>Autosave on </span>
                <span className={dark ? "text-sky-200/90" : "text-brand/80"}>· {idleSuffix}</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">On </span>
                <span className="hidden sm:inline">Autosave on </span>
                <span className={dark ? "text-sky-200/90" : "text-brand/80"}>· {idleSuffix}</span>
              </>
            )}
          </span>
        </span>
      ) : null}
    </div>
  );
}
