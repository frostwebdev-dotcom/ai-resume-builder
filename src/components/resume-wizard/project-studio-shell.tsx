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
  AlertTriangle,
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

import { DownloadResumeModal } from "@/components/download/download-resume-modal";
import { ResumeStTracker } from "@/components/analytics/resume-st-tracker";
import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { useCoalescedHistory } from "@/hooks/use-guest-studio-store";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  getCandidateDisplayName,
  hasMeaningfulGuestResumeContent,
} from "@/lib/resume-wizard/content-readiness";
import type { JobTailorReviewV1, TailoringCompareV1 } from "@/lib/job-target/types";
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
import { saveWizardDraftAction } from "@/services/resume-wizard/actions";

const projectMenuItemClass =
  "cursor-pointer gap-3 rounded-sm px-2 py-2.5 text-slate-700 focus-visible:bg-[#2268d7] focus-visible:text-white data-[highlighted]:bg-[#2268d7] data-[highlighted]:text-white [&_svg]:opacity-80 [&_svg]:data-[highlighted]:opacity-100 [&_svg]:data-[highlighted]:text-white";

function hasMeaningfulText(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return Boolean(normalized && normalized !== "untitled resume");
}

function getExportMissingItems(state: WizardStateV1): string[] {
  const p = state.personal;
  const hasNameOrTitle =
    hasMeaningfulText(p.fullName) ||
    hasMeaningfulText([p.givenName, p.middleName, p.familyName].filter(Boolean).join(" ")) ||
    hasMeaningfulText(p.desiredJobPosition) ||
    hasMeaningfulText(state.summary.headline);
  const hasContact =
    hasMeaningfulText(p.email) ||
    hasMeaningfulText(p.phone) ||
    hasMeaningfulText(p.location) ||
    hasMeaningfulText(p.city) ||
    hasMeaningfulText(p.linkedIn) ||
    hasMeaningfulText(p.website);
  const hasExperience = state.experience.entries.some(
    (e) =>
      hasMeaningfulText(e.title) ||
      hasMeaningfulText(e.company) ||
      e.highlights.some(hasMeaningfulText),
  );
  const hasEducation = state.education.entries.some(
    (e) => hasMeaningfulText(e.school) || hasMeaningfulText(e.degree) || hasMeaningfulText(e.field),
  );
  const hasProjects = state.projects.entries.some(
    (pjt) => hasMeaningfulText(pjt.name) || hasMeaningfulText(pjt.description),
  );
  const hasSkills = hasMeaningfulText(state.skills.lines);

  const missing: string[] = [];
  if (!hasNameOrTitle) missing.push("Candidate name or professional title");
  if (!hasContact) missing.push("At least one contact method");
  if (!(hasExperience || hasEducation || hasSkills || hasProjects)) {
    missing.push("Experience, education, skills, or projects");
  }
  return missing;
}

export type ProjectStudioShellProps = {
  projectId: string;
  projectTitle: string;
  initialWizard: WizardStateV1;
  initialJobTarget: JobTargetClientView | null;
  templateSlug: TemplateSlug;
  initialResumeStyle: ResumeStyleV1;
  avatarSignedUrl: string | null;
  canDownload: boolean;
  checkoutStatus?: "success" | "pending" | "failed" | "cancelled";
  checkoutEnabled: boolean;
  showPaymentSetupDetails: boolean;
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
  canDownload,
  checkoutStatus,
  checkoutEnabled,
  showPaymentSetupDetails,
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
  const [jobTailorReview, setJobTailorReview] = useState<JobTailorReviewV1 | null>(
    initialJobTarget?.jobTailorReview ?? null,
  );
  const [jobTargetTitle, setJobTargetTitle] = useState<string | null>(initialJobTarget?.title ?? null);
  const [jobTargetCompany, setJobTargetCompany] = useState<string | null>(
    initialJobTarget?.company ?? null,
  );
  const [jobTargetJobDescription, setJobTargetJobDescription] = useState<string | null>(
    initialJobTarget?.jobDescription ?? null,
  );

  useLayoutEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setTailoringCompare(initialJobTarget?.tailoringCompare ?? null);
    setJobTailorReview(initialJobTarget?.jobTailorReview ?? null);
    setJobTargetTitle(initialJobTarget?.title ?? null);
    setJobTargetCompany(initialJobTarget?.company ?? null);
    setJobTargetJobDescription(initialJobTarget?.jobDescription ?? null);
  }, [
    projectId,
    initialJobTarget?.tailoringCompare,
    initialJobTarget?.jobTailorReview,
    initialJobTarget?.title,
    initialJobTarget?.company,
    initialJobTarget?.jobDescription,
  ]);

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
      const trimmed = next.trim() || "Resume Draft";
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
  const [exportPending, setExportPending] = useState<null | "saving" | "preparing" | "checkout">(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [incompleteExportOpen, setIncompleteExportOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [missingExportItems, setMissingExportItems] = useState<string[]>([]);

  useUnsavedWarning(isDirty);

  const hasSavedJobTarget = (jobTargetJobDescription?.trim().length ?? 0) > 0;

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

  const candidateName = getCandidateDisplayName(content);
  const targetRole = content.personal.desiredJobPosition.trim() || content.summary.headline.trim();
  const displayTitle = candidateName
    ? `${candidateName} Resume`
    : targetRole
      ? `${targetRole} Resume`
      : "Resume Draft";
  const hasMeaningfulContent = hasMeaningfulGuestResumeContent(content);
  const exportMissingItems = getExportMissingItems(content);
  const downloadReady = exportMissingItems.length === 0;
  const defaultDownloadName = candidateName
    ? `${candidateName} Resume`
    : targetRole
      ? `${targetRole} Resume`
      : titleDraft.trim() && titleDraft.trim().toLowerCase() !== "untitled resume"
        ? titleDraft.trim()
        : "Resume Draft";

  const handlePreviewExportClick = useCallback(async () => {
    if (exportPending) return;
    setExportError(null);
    trackClientEvent(ANALYTICS_EVENTS.PAY_ONCE_DOWNLOAD_CLICKED, {
      project_id_prefix: projectId.slice(0, 8),
      paid: canDownload,
    });
    setExportPending("saving");
    const latest = contentRef.current;
    const result = await saveWizardDraftAction(projectId, latest);
    setExportPending(null);

    if (!result.ok) {
      setExportError(result.error);
      return;
    }

    const missing = getExportMissingItems(latest);
    if (!canDownload && missing.length > 0) {
      setMissingExportItems(missing);
      trackClientEvent(ANALYTICS_EVENTS.EXPORT_VALIDATION_FAILED, {
        project_id_prefix: projectId.slice(0, 8),
        missing_count: missing.length,
      });
      trackClientEvent(ANALYTICS_EVENTS.EXPORT_VALIDATION_WARNING_SHOWN, {
        project_id_prefix: projectId.slice(0, 8),
        missing_count: missing.length,
      });
      setIncompleteExportOpen(true);
      return;
    }

    setDownloadModalOpen(true);
    trackClientEvent(ANALYTICS_EVENTS.DOWNLOAD_MODAL_OPENED, {
      project_id_prefix: projectId.slice(0, 8),
      source: "builder_cta",
    });
  }, [canDownload, exportPending, projectId]);

  const ctaBusyLabel =
    exportPending === "saving"
      ? "Preparing PDF..."
      : exportPending === "preparing"
        ? "Preparing PDF..."
        : exportPending === "checkout"
          ? "Starting checkout..."
          : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <ResumeStTracker surface="project_build" projectId={projectId} />
      <header className="shrink-0 border-b border-black/30 bg-[#17191d] pt-[env(safe-area-inset-top,0px)] text-white">
        {/*
          Mirrors the guest `/create` top bar: 1fr | auto | 1fr columns so the title block stays
          centered, autosave sits beside the back link, and right-side actions stay aligned.
        */}
        <div className="grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 py-1.5 pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] sm:min-h-14 sm:gap-y-0 sm:py-0 sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))] lg:grid-cols-[1fr_minmax(0,auto)_1fr]">
          <div className="flex min-w-0 content-center items-center justify-self-start gap-x-1.5 gap-y-1 sm:gap-x-2">
            <Link
              href={ROUTES.app.project(projectId)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white",
              )}
              aria-label="Back to project"
            >
              <span className="text-base leading-none">←</span>
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Project</span>
            </Link>
            <span className="hidden lg:inline-flex">
            <AutosaveStatusChip
              context="project"
              status={saveStatus}
              lastError={lastError}
              onRetry={retry}
              isDirty={isDirty}
              surface="dark"
              layout="toolbar"
            />
            </span>
          </div>

          <div className="relative z-10 flex min-w-0 justify-self-stretch lg:max-w-[min(32rem,calc(100dvw-20rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)))] lg:justify-self-center">
            <div className="flex w-full min-w-0 items-end gap-2.5 sm:gap-3">
              <input
                ref={titleInputRef}
                key={`title-${displayTitle}`}
                defaultValue={displayTitle}
                onBlur={(e) => {
                  const next = e.currentTarget.value.trim();
                  if (!next || next === displayTitle) return;
                  commitTitle(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  else if (e.key === "Escape") {
                    e.currentTarget.value = displayTitle;
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                disabled={titlePending}
                aria-label="Resume project title"
                aria-describedby={titleError ? "project-title-error" : undefined}
                maxLength={120}
                placeholder="Resume Draft"
                id="project-draft-title"
                className="min-w-0 flex-1 rounded-none border-0 border-b-2 border-[#3b82f6] bg-transparent px-0.5 pb-0.5 text-left text-xs font-normal text-slate-100 caret-white placeholder:text-slate-500 outline-none transition-colors selection:bg-sky-500/35 focus-visible:border-sky-300 disabled:opacity-70 sm:text-center sm:text-sm"
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-end justify-self-end gap-x-1 gap-y-1.5 sm:gap-x-2">
            <span className="lg:hidden">
              <AutosaveStatusChip
                context="project"
                status={saveStatus}
                lastError={lastError}
                onRetry={retry}
                isDirty={isDirty}
                surface="dark"
                layout="toolbar"
                iconOnly
              />
            </span>
            <div className="hidden items-center gap-x-1 gap-y-1.5 lg:flex">
            <button
              type="button"
              onClick={handleUndoContent}
              disabled={!contentHistory.canUndo}
              className="inline-flex size-11 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] shrink-0 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:size-8 sm:min-h-0 sm:min-w-0"
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleRedoContent}
              disabled={!contentHistory.canRedo}
              className="inline-flex size-11 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] shrink-0 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:size-8 sm:min-h-0 sm:min-w-0"
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

            <span className="hidden max-w-[11rem] text-right text-[0.68rem] font-medium leading-tight text-slate-300 xl:inline">
              Preview free · Secure checkout
            </span>

            <button
              type="button"
              disabled={Boolean(exportPending)}
              onClick={() => void handlePreviewExportClick()}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-10 min-h-10 max-w-full shrink gap-1.5 truncate rounded-full bg-[#2268d7] px-3 text-xs font-semibold hover:bg-[#1f5fca] disabled:cursor-wait disabled:opacity-75 sm:h-8 sm:min-h-0 sm:max-w-none sm:px-3",
              )}
              aria-label={canDownload ? "Download PDF" : "Pay once to download"}
              aria-busy={Boolean(exportPending)}
            >
              {exportPending ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="truncate">
                {ctaBusyLabel ?? (canDownload ? "Download PDF" : "Pay once to download")}
              </span>
            </button>
            </div>
          </div>
        </div>
      </header>

      {titleError ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3" id="project-title-error">
          <FeedbackBanner tone="error" title="Could not rename" description={titleError} />
        </div>
      ) : null}

      {checkoutStatus ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <FeedbackBanner
            tone={
              checkoutStatus === "success"
                ? "success"
                : checkoutStatus === "pending"
                  ? "warning"
                  : checkoutStatus === "cancelled"
                    ? "info"
                    : "error"
            }
            title={
              checkoutStatus === "success"
                ? "Your PDF export is unlocked."
                : checkoutStatus === "pending"
                  ? "Payment is still processing"
                  : checkoutStatus === "cancelled"
                    ? "Checkout was cancelled"
                    : "Payment did not complete"
            }
            description={
              checkoutStatus === "success"
                ? "Use Download PDF to prepare a secure file without another payment."
                : checkoutStatus === "pending"
                  ? "Stripe is still confirming the payment. Refresh in a moment before trying again."
                  : checkoutStatus === "cancelled"
                    ? "You can continue editing or restart checkout when you are ready."
                    : "No PDF entitlement was unlocked. You can try checkout again from this builder."
            }
          />
        </div>
      ) : null}

      {exportError ? (
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <FeedbackBanner
            tone="error"
            title="Could not prepare download"
            description={exportError}
          />
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
          onProjectPreviewClick={() => void handlePreviewExportClick()}
          projectPreviewPending={Boolean(exportPending)}
          projectPreviewPendingText={ctaBusyLabel ?? undefined}
          projectCanDownload={canDownload}
          showPreviewAction={hasMeaningfulContent}
          showDownloadAction={downloadReady || canDownload}
          previewAvatarUrl={avatarSignedUrl}
          jobAssist={{
            projectId,
            hasSavedJobTarget,
            jobTailorReview,
            tailoringCompare,
            setTailoringCompare,
            setJobTailorReview,
            jobTargetTitle,
            jobTargetCompany,
            jobTargetJobDescription,
            onJobTargetSaved: (payload) => {
              setJobTargetTitle(payload.title);
              setJobTargetCompany(payload.company);
              setJobTargetJobDescription(payload.jobDescription);
              setTailoringCompare(null);
              setJobTailorReview(null);
            },
            onTailoringPipelineComplete: (data) => {
              setTailoringCompare(data.tailoringCompare);
              setJobTailorReview(data.jobTailorReview);
            },
          }}
        />
      </div>

      <Dialog open={incompleteExportOpen} onOpenChange={setIncompleteExportOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/15">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <DialogTitle>Your resume may be incomplete</DialogTitle>
            <DialogDescription>
              Before downloading, we recommend adding the following information:
            </DialogDescription>
          </DialogHeader>
          {missingExportItems.length > 0 ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-50/80 p-3">
              <p className="text-sm font-semibold text-amber-950">Recommended additions</p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-950/85">
                {missingExportItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="touch"
              onClick={() => setIncompleteExportOpen(false)}
            >
              Continue editing
            </Button>
            <Button
              type="button"
              size="touch"
              disabled={Boolean(exportPending)}
              onClick={() => {
                setIncompleteExportOpen(false);
                setDownloadModalOpen(true);
                trackClientEvent(ANALYTICS_EVENTS.DOWNLOAD_MODAL_OPENED, {
                  project_id_prefix: projectId.slice(0, 8),
                  source: "incomplete_download_anyway",
                });
              }}
            >
              Download anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadResumeModal
        key={`${projectId}:${defaultDownloadName}:${canDownload ? "unlocked" : "locked"}`}
        open={downloadModalOpen}
        onOpenChange={setDownloadModalOpen}
        projectId={projectId}
        defaultFileName={defaultDownloadName}
        canDownload={canDownload}
        checkoutEnabled={checkoutEnabled}
        showPaymentSetupDetails={showPaymentSetupDetails}
      />
    </div>
  );
}
