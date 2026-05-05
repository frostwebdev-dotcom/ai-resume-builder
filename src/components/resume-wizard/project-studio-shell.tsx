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
import { Download, Loader2, Redo2, Undo2 } from "lucide-react";

import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { buttonVariants } from "@/components/ui/button";
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
import { setProjectTemplateAction, updateResumeStyleAction } from "@/services/projects/actions";

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
        <div className="flex flex-col">
        <div className="grid h-12 w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-x-2 px-2 sm:h-14 sm:gap-x-3 sm:px-4">
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              href={ROUTES.app.project(projectId)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 gap-1.5 rounded-full px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white",
              )}
              aria-label="Back to project"
            >
              <span className="text-base leading-none">←</span>
              Project
            </Link>
          </div>

          <div className="relative z-10 flex min-w-0 max-w-[min(22rem,calc(100vw-7.5rem))] justify-self-center sm:max-w-[min(32rem,calc(100vw-11rem))]">
            <div className="flex w-full min-w-0 items-end justify-center gap-2.5 sm:gap-3">
              <p
                className="min-w-0 max-w-full truncate border-b-2 border-[#3b82f6] px-0.5 pb-0.5 text-center text-xs font-normal text-slate-100 sm:text-sm"
                title={projectTitle}
                id="project-draft-title"
              >
                {projectTitle}
              </p>
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
        <div className="flex w-full min-w-0 items-center justify-center border-t border-white/[0.08] pb-2 pt-1 pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] sm:justify-end sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pt-1.5">
          <AutosaveStatusChip
            context="project"
            status={saveStatus}
            lastError={lastError}
            onRetry={retry}
            surface="dark"
          />
        </div>
        </div>
      </header>

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
