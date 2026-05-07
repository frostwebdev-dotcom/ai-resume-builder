"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  Copy,
  Download,
  Globe,
  Loader2,
  MoreVertical,
  Redo2,
  Tag,
  Undo2,
  UserPlus,
} from "lucide-react";

import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { useCoalescedHistory } from "@/hooks/use-guest-studio-store";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import type { JobTargetClientView } from "@/lib/job-target/client-types";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { TEMPLATE_IDS, type TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import {
  duplicateProjectAction,
  renameProjectAction,
  setProjectTemplateAction,
  updateResumeStyleAction,
} from "@/services/projects/actions";

const projectMenuItemClass =
  "cursor-pointer gap-3 rounded-sm px-2 py-2.5 text-slate-700 focus-visible:bg-[#2268d7] focus-visible:text-white data-[highlighted]:bg-[#2268d7] data-[highlighted]:text-white [&_svg]:opacity-80 [&_svg]:data-[highlighted]:opacity-100 [&_svg]:data-[highlighted]:text-white";

export type ProjectStudioShellProps = {
  projectId: string;
  projectTitle: string;
  initialWizard: WizardStateV1;
  initialJobTarget: JobTargetClientView | null;
  templateSlug: TemplateSlug;
  initialResumeStyle: ResumeStyleV1;
  avatarSignedUrl: string | null;
};

/**
 * Signed-in project draft: same studio chrome as public `/create` (dark top bar + white editor),
 * with draft JSON persisted via `useWizardAutosave` and template + appearance via project actions.
 */
export function ProjectStudioShell({
  projectId,
  projectTitle,
  initialWizard,
  initialJobTarget,
  templateSlug: serverTemplateSlug,
  initialResumeStyle,
  avatarSignedUrl,
}: ProjectStudioShellProps) {
  const router = useRouter();
  const [content, setContent] = useState<WizardStateV1>(initialWizard);
  const contentRef = useRef(content);
  const contentHistory = useCoalescedHistory<WizardStateV1>({ delayMs: 600, max: 50 });
  const [templateSlug, setTemplateSlug] = useState<TemplateSlug>(serverTemplateSlug);
  const [resumeStyle, setResumeStyle] = useState<ResumeStyleV1>(initialResumeStyle);
  const [titleDraft, setTitleDraft] = useState<string>(projectTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [titlePending, startTitleTransition] = useTransition();
  const [duplicatePending, startDuplicateTransition] = useTransition();

  const [tailoringCompare, setTailoringCompare] = useState<TailoringCompareV1 | null>(
    initialJobTarget?.tailoringCompare ?? null,
  );

  useLayoutEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setTailoringCompare(initialJobTarget?.tailoringCompare ?? null);
  }, [projectId, initialJobTarget?.tailoringCompare]);

  useEffect(() => {
    setTemplateSlug(serverTemplateSlug);
  }, [serverTemplateSlug]);

  useEffect(() => {
    setResumeStyle(initialResumeStyle);
  }, [initialResumeStyle]);

  useEffect(() => {
    setTitleDraft(projectTitle);
  }, [projectTitle]);

  const commitTitle = useCallback(
    (next: string) => {
      const trimmed = next.trim() || "Untitled resume";
      if (trimmed === projectTitle) {
        setTitleDraft(trimmed);
        return;
      }
      setTitleDraft(trimmed);
      setTitleError(null);
      startTitleTransition(async () => {
        const fd = new FormData();
        fd.set("projectId", projectId);
        fd.set("title", trimmed);
        const result = await renameProjectAction({}, fd);
        if (result.error) {
          setTitleError(result.error);
          setTitleDraft(projectTitle);
          return;
        }
        router.refresh();
      });
    },
    [projectId, projectTitle, router],
  );

  const handleShareResume = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: projectTitle || "My resume",
          text: "Resume draft",
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // User cancelled the share, or the API is unavailable. No need to surface this.
    }
  }, [projectTitle]);

  const handleDuplicateResume = useCallback(() => {
    const fd = new FormData();
    fd.set("projectId", projectId);
    startDuplicateTransition(() => {
      void duplicateProjectAction({}, fd);
    });
  }, [projectId]);

  const { saveStatus, lastError, retry, isDirty } = useWizardAutosave({
    projectId,
    state: content,
    enabled: true,
  });

  useUnsavedWarning(isDirty);

  const hasSavedJobTarget = (initialJobTarget?.jobDescription?.trim().length ?? 0) > 0;

  const updateContentWithHistory = useCallback(
    (updater: SetStateAction<WizardStateV1>) => {
      const before = contentRef.current;
      setContent((curr) => {
        const next =
          typeof updater === "function"
            ? (updater as (c: WizardStateV1) => WizardStateV1)(curr)
            : updater;
        contentRef.current = next;
        return next;
      });
      contentHistory.commit(before);
    },
    [contentHistory],
  );

  const handleUndoContent = useCallback(() => {
    const prev = contentHistory.undo(contentRef.current);
    if (!prev) return;
    contentRef.current = prev;
    setContent(prev);
  }, [contentHistory]);

  const handleRedoContent = useCallback(() => {
    const next = contentHistory.redo(contentRef.current);
    if (!next) return;
    contentRef.current = next;
    setContent(next);
  }, [contentHistory]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedoContent();
        else handleUndoContent();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedoContent();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndoContent, handleRedoContent]);

  const previewHref = ROUTES.app.projectPreview(projectId);
  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.app.projectBuild(projectId))}`;

  const styleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [styleError, setStyleError] = useState<string | null>(null);

  const handleResumeStyleChange = useCallback(
    (updater: SetStateAction<ResumeStyleV1>) => {
      setStyleError(null);
      setResumeStyle((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (s: ResumeStyleV1) => ResumeStyleV1)(prev)
            : updater;
        if (styleSaveTimer.current) clearTimeout(styleSaveTimer.current);
        styleSaveTimer.current = setTimeout(() => {
          void (async () => {
            const res = await updateResumeStyleAction({ projectId, resumeStyle: next });
            if (!res.ok) setStyleError(res.error);
            else setStyleError(null);
          })();
        }, 500);
        return next;
      });
    },
    [projectId],
  );

  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templatePending, startTemplateTransition] = useTransition();

  const handleTemplateChange = useCallback(
    (slug: TemplateSlug) => {
      setTemplateError(null);
      const previousSlug = templateSlug;
      setTemplateSlug(slug);
      startTemplateTransition(async () => {
        const res = await setProjectTemplateAction({
          projectId,
          templateId: TEMPLATE_IDS[slug],
        });
        if (!res.ok) {
          setTemplateError(res.error);
          setTemplateSlug(previousSlug);
          return;
        }
        setTemplateError(null);
        router.refresh();
      });
    },
    [projectId, router, templateSlug],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-black/30 bg-[#17191d] pt-[env(safe-area-inset-top,0px)] text-white">
        {/*
          Mirrors the guest `/create` top bar: 1fr | auto | 1fr columns so the title block stays
          centered, autosave sits beside the back link, and right-side actions stay aligned.
        */}
        <div className="grid min-h-12 w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-x-2 gap-y-2 py-1.5 pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] sm:min-h-14 sm:gap-y-0 sm:py-0 sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <div className="flex min-w-0 flex-wrap content-center items-center justify-self-start gap-x-1.5 gap-y-1 sm:gap-x-2">
            <Link
              href={ROUTES.app.project(projectId)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white",
              )}
              aria-label="Back to project"
            >
              <span className="text-base leading-none">←</span>
              Project
            </Link>
            <AutosaveStatusChip
              context="project"
              status={saveStatus}
              lastError={lastError}
              onRetry={retry}
              surface="dark"
              layout="toolbar"
            />
          </div>

          <div className="relative z-10 flex min-w-0 max-w-[min(22rem,calc(100dvw_-_15rem_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px)))] justify-self-center sm:max-w-[min(32rem,calc(100dvw_-_20rem_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px)))]">
            <div className="flex w-full min-w-0 items-end gap-2.5 sm:gap-3">
              <input
                ref={titleInputRef}
                key={`title-${projectTitle}`}
                defaultValue={titleDraft}
                onBlur={(e) => {
                  commitTitle(e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  else if (e.key === "Escape") {
                    e.currentTarget.value = projectTitle;
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                disabled={titlePending}
                aria-label="Resume project title"
                aria-describedby={titleError ? "project-title-error" : undefined}
                maxLength={120}
                placeholder="Untitled resume"
                id="project-draft-title"
                className="min-w-0 flex-1 rounded-none border-0 border-b-2 border-[#3b82f6] bg-transparent px-0.5 pb-0.5 text-center text-xs font-normal text-slate-100 caret-white placeholder:text-slate-500 outline-none transition-colors selection:bg-sky-500/35 focus-visible:border-sky-300 disabled:opacity-70 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end justify-self-end gap-x-1 gap-y-1.5 sm:gap-x-2">
            <button
              type="button"
              onClick={handleUndoContent}
              disabled={!contentHistory.canUndo}
              className="inline-flex size-8 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleRedoContent}
              disabled={!contentHistory.canRedo}
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

            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-transparent text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/35",
                )}
                aria-label="Resume actions"
              >
                <MoreVertical className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-w-[12.5rem] border-0 bg-white p-1.5 text-slate-800 shadow-xl ring-1 ring-black/10"
              >
                <DropdownMenuItem
                  className={projectMenuItemClass}
                  onClick={() => {
                    const el = titleInputRef.current;
                    if (!el) return;
                    el.focus();
                    el.select();
                  }}
                >
                  <Tag className="size-4 shrink-0" aria-hidden />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem className={projectMenuItemClass} onClick={() => void handleShareResume()}>
                  <UserPlus className="size-4 shrink-0" aria-hidden />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={projectMenuItemClass}
                  disabled={duplicatePending}
                  onClick={handleDuplicateResume}
                >
                  <Copy className="size-4 shrink-0" aria-hidden />
                  {duplicatePending ? "Duplicating…" : "Duplicate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href={previewHref}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-8 gap-1.5 rounded-full bg-[#2268d7] px-3 text-xs font-semibold hover:bg-[#1f5fca]",
              )}
              aria-label="Open Preview and export"
            >
              <Download className="size-3.5" aria-hidden />
              Preview &amp; export
            </Link>
          </div>
        </div>
      </header>

      {titleError ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3" id="project-title-error">
          <FeedbackBanner tone="error" title="Could not rename" description={titleError} />
        </div>
      ) : null}

      {templatePending ? (
        <p
          className="inline-flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          Updating template…
        </p>
      ) : null}

      {templateError ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <FeedbackBanner tone="error" title="Could not update template" description={templateError} />
        </div>
      ) : null}

      {styleError ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <FeedbackBanner tone="error" title="Could not save appearance" description={styleError} />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <GuestStudioEditor
          content={content}
          onContentChange={updateContentWithHistory}
          templateSlug={templateSlug}
          onTemplateChange={handleTemplateChange}
          resumeStyle={resumeStyle}
          onResumeStyleChange={handleResumeStyleChange}
          loginHref={loginHref}
          persistMode="project"
          projectPreviewHref={previewHref}
          previewAvatarUrl={avatarSignedUrl}
          jobAssist={{
            projectId,
            hasSavedJobTarget,
            tailoringCompare,
            setTailoringCompare,
          }}
        />
      </div>
    </div>
  );
}
