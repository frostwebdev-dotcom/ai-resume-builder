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
import { ArrowLeft, Eye, Loader2, Redo2, Undo2 } from "lucide-react";

import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { JobTargetPanel } from "@/components/resume-wizard/job-target-panel";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { useCoalescedHistory } from "@/hooks/use-guest-studio-store";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { ROUTES } from "@/lib/constants";
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
 * Signed-in project draft using the same studio UI as `/create`, with draft JSON persisted via
 * `useWizardAutosave` / `saveWizardDraftAction` and template + appearance via existing project actions.
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

  const [jobSnapshot, setJobSnapshot] = useState({
    title: initialJobTarget?.title ?? null,
    company: initialJobTarget?.company ?? null,
    jobDescription: initialJobTarget?.jobDescription ?? null,
  });
  const [tailoringCompare, setTailoringCompare] = useState<TailoringCompareV1 | null>(
    initialJobTarget?.tailoringCompare ?? null,
  );

  useLayoutEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setJobSnapshot({
      title: initialJobTarget?.title ?? null,
      company: initialJobTarget?.company ?? null,
      jobDescription: initialJobTarget?.jobDescription ?? null,
    });
    setTailoringCompare(initialJobTarget?.tailoringCompare ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset job snapshot when switching projects
  }, [projectId]);

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

  const hasSavedJobTarget = (jobSnapshot.jobDescription?.trim().length ?? 0) > 0;

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-5 border-b border-border/70 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href={ROUTES.app.project(projectId)}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:min-h-0"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to project
            </Link>
            <Link
              href={previewHref}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 transition-colors hover:underline sm:min-h-0"
            >
              <Eye className="size-4" aria-hidden />
              Preview &amp; export
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!contentHistory.canUndo}
              onClick={handleUndoContent}
              aria-label="Undo edit"
            >
              <Undo2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Undo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!contentHistory.canRedo}
              onClick={handleRedoContent}
              aria-label="Redo edit"
            >
              <Redo2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Redo</span>
            </Button>
            <AutosaveStatusChip
              context="project"
              status={saveStatus}
              lastError={lastError}
              onRetry={retry}
            />
          </div>
        </div>
        <div>
          <p className="text-eyebrow">Draft</p>
          <h1 className="mt-2 text-headline text-foreground">{projectTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Edit in studio view with a live preview. When you are ready, open Preview &amp; export to
            choose a template and export a PDF.
          </p>
        </div>
      </div>

      {templatePending ? (
        <p
          className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          Updating template…
        </p>
      ) : null}

      {templateError ? (
        <div className="mt-4">
          <FeedbackBanner tone="error" title="Could not update template" description={templateError} />
        </div>
      ) : null}

      {styleError ? (
        <div className="mt-4">
          <FeedbackBanner tone="error" title="Could not save appearance" description={styleError} />
        </div>
      ) : null}

      <div className="mt-6 min-h-0 flex-1 border-y border-border/70 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:max-w-none lg:px-8">
          <JobTargetPanel
            key={projectId}
            projectId={projectId}
            initialTitle={jobSnapshot.title}
            initialCompany={jobSnapshot.company}
            initialJobDescription={jobSnapshot.jobDescription}
            onSaved={(payload) => setJobSnapshot(payload)}
          />
        </div>
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
