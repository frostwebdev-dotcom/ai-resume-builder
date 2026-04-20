"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  Cloud,
  Download,
  Globe,
  MoreHorizontal,
  Redo2,
  Undo2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { loadGuestWizardDraftFromStorage } from "@/hooks/use-guest-wizard-autosave";
import {
  DEFAULT_GUEST_PRESENTATION,
  loadGuestPresentationFromStorage,
  useCoalescedHistory,
  useGuestPresentationAutosave,
  type CoalescedHistory,
  type GuestStudioPresentation,
} from "@/hooks/use-guest-studio-store";
import { createEmptyWizardState } from "@/lib/resume-wizard/defaults";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { ROUTES } from "@/lib/constants";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { cn } from "@/lib/utils";

type Snapshot = {
  content: WizardStateV1;
  presentation: GuestStudioPresentation;
};

/**
 * Studio-style entry point for the public `/create` page.
 * Renders a dark top toolbar + two-column accordion editor + live preview,
 * all mounted client-only so localStorage hydration happens in the browser.
 *
 * Architecture:
 * - `content` + `presentation` are controlled state (live during typing).
 * - Undo/Redo is a coalesced buffer: rapid keystrokes collapse into a
 *   single history slot (~600ms), so undo feels like word-boundary undo.
 * - Clicks on template/color/etc. commit immediately as a discrete slot.
 */
export function GuestCreateClient() {
  const [initialContent] = useState<WizardStateV1>(
    () => loadGuestWizardDraftFromStorage() ?? createEmptyWizardState(),
  );
  const [initialPresentation] = useState<GuestStudioPresentation>(
    () => loadGuestPresentationFromStorage() ?? DEFAULT_GUEST_PRESENTATION,
  );

  const [content, setContent] = useState<WizardStateV1>(initialContent);
  const [presentation, setPresentation] = useState<GuestStudioPresentation>(
    initialPresentation,
  );

  const history: CoalescedHistory<Snapshot> = useCoalescedHistory<Snapshot>();

  const snapshotNow = useCallback(
    (): Snapshot => ({ content, presentation }),
    [content, presentation],
  );

  // Typing edits — coalesced into one undo slot per ~600ms burst.
  const updateContent = useCallback(
    (updater: SetStateAction<WizardStateV1>) => {
      const prev = snapshotNow();
      setContent((curr) =>
        typeof updater === "function"
          ? (updater as (v: WizardStateV1) => WizardStateV1)(curr)
          : updater,
      );
      history.commit(prev);
    },
    [history, snapshotNow],
  );

  // Presentation edits (template, colors, font) — commit immediately.
  const updatePresentation = useCallback(
    (updater: SetStateAction<GuestStudioPresentation>) => {
      const prev = snapshotNow();
      setPresentation((curr) =>
        typeof updater === "function"
          ? (updater as (p: GuestStudioPresentation) => GuestStudioPresentation)(curr)
          : updater,
      );
      history.commit(prev, /* immediate */ true);
    },
    [history, snapshotNow],
  );

  const setTemplate = useCallback(
    (slug: TemplateSlug) =>
      updatePresentation((p) => ({ ...p, templateSlug: slug })),
    [updatePresentation],
  );
  const setResumeStyle = useCallback(
    (updater: SetStateAction<ResumeStyleV1>) =>
      updatePresentation((p) => ({
        ...p,
        style:
          typeof updater === "function"
            ? (updater as (s: ResumeStyleV1) => ResumeStyleV1)(p.style)
            : updater,
      })),
    [updatePresentation],
  );

  const handleUndo = useCallback(() => {
    const prev = history.undo(snapshotNow());
    if (!prev) return;
    setContent(prev.content);
    setPresentation(prev.presentation);
  }, [history, snapshotNow]);

  const handleRedo = useCallback(() => {
    const next = history.redo(snapshotNow());
    if (!next) return;
    setContent(next.content);
    setPresentation(next.presentation);
  }, [history, snapshotNow]);

  useGuestPresentationAutosave(presentation);

  // Global keyboard shortcuts — mimic every text editor.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

  const loginHref = useMemo(
    () => `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.create)}`,
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <TopBar
        title={presentation.title}
        onTitleCommit={(next) => updatePresentation((p) => ({ ...p, title: next }))}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        loginHref={loginHref}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <GuestStudioEditor
          content={content}
          onContentChange={updateContent}
          templateSlug={presentation.templateSlug}
          onTemplateChange={setTemplate}
          resumeStyle={presentation.style}
          onResumeStyleChange={setResumeStyle}
          loginHref={loginHref}
        />
      </div>
    </div>
  );
}

function TopBar({
  title,
  onTitleCommit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  loginHref,
}: {
  title: string;
  onTitleCommit: (next: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  loginHref: string;
}) {
  // The title input is uncontrolled (defaultValue + remount on external change)
  // so typing stays buttery without a sync-from-props effect.
  return (
    <header className="shrink-0 border-b border-black/30 bg-[#17191d] pt-[env(safe-area-inset-top,0px)] text-white">
      <div className="flex h-12 items-center justify-between gap-2 px-2 sm:h-14 sm:px-3">
      <div className="flex min-w-0 items-center gap-1">
        <Link
          href={ROUTES.home}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 gap-1.5 rounded-full px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white",
          )}
          aria-label="Back to resumes"
        >
          <span className="text-base leading-none">←</span>
          Resumes
        </Link>
      </div>

      <div className="mx-2 flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <input
          key={`title-${title}`}
          defaultValue={title}
          onBlur={(e) => {
            const v = e.currentTarget.value.trim() || "Untitled resume";
            if (v !== title) onTitleCommit(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Resume title"
          maxLength={80}
          className="w-full max-w-[18rem] truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-center text-xs font-medium text-slate-100 outline-none transition-colors hover:border-white/10 focus:border-white/30 focus:bg-white/5 sm:text-sm"
        />
        <Cloud className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex size-8 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="inline-flex size-8 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="size-4" aria-hidden />
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden h-8 gap-1 rounded-full px-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex"
          aria-label="Language"
        >
          <Globe className="size-3.5" aria-hidden />
          EN
          <ChevronDown className="size-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0 text-slate-200 hover:bg-white/10 hover:text-white"
          aria-label="More options"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
        <Link
          href={loginHref}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-8 gap-1.5 rounded-full bg-[#2268d7] px-3 text-xs font-semibold hover:bg-[#1f5fca]",
          )}
          aria-label="Sign in to download as PDF"
        >
          <Download className="size-3.5" aria-hidden />
          Download
        </Link>
      </div>
      </div>
    </header>
  );
}
