"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  CloudUpload,
  Copy,
  Globe,
  LayoutDashboard,
  Loader2,
  MoreVertical,
  Redo2,
  Tag,
  Undo2,
  UserPlus,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { GuestDraftLocalSaveNote } from "@/components/resume-wizard/guest-draft-local-save-note";
import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import {
  clearGuestWizardDraftFromStorage,
  loadGuestWizardDraftFromStorage,
  useGuestWizardAutosave,
} from "@/hooks/use-guest-wizard-autosave";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import {
  DEFAULT_GUEST_PRESENTATION,
  clearGuestPresentationFromStorage,
  loadGuestPresentationFromStorage,
  useCoalescedHistory,
  useGuestPresentationAutosave,
  type CoalescedHistory,
  type GuestStudioPresentation,
} from "@/hooks/use-guest-studio-store";
import { createDemoWizardState } from "@/lib/resume-wizard/demo-wizard-state";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { CREATE_RESUME_POST_AUTH_NEXT, ROUTES } from "@/lib/constants";
import { importGuestDraftToProjectAction } from "@/services/projects/actions";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { isTemplateSlug, type TemplateSlug } from "@/lib/resume-preview/template-ids";
import { cn } from "@/lib/utils";

type Snapshot = {
  content: WizardStateV1;
  presentation: GuestStudioPresentation;
};

const GUEST_IMPORT_LOCK = "resume:guest-draft-import-lock";

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
    () => loadGuestWizardDraftFromStorage() ?? createDemoWizardState(),
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
    () => `${ROUTES.auth.login}?next=${encodeURIComponent(CREATE_RESUME_POST_AUTH_NEXT)}`,
    [],
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const templateFromUrlApplied = useRef(false);
  const [browserHasSession, setBrowserHasSession] = useState(false);

  const contentRef = useRef(content);
  const presentationRef = useRef(presentation);
  contentRef.current = content;
  presentationRef.current = presentation;

  const [accountSyncError, setAccountSyncError] = useState<string | null>(null);
  const [isAccountImporting, setIsAccountImporting] = useState(false);

  useGuestPresentationAutosave(presentation, !isAccountImporting);

  const { saveStatus, lastError, retry, flushSave, isDirty } = useGuestWizardAutosave({
    state: content,
    enabled: !isAccountImporting,
  });

  useUnsavedWarning(isDirty && !isAccountImporting, "You have unsaved resume changes. Leave this page?");

  const performImportToAccount = useCallback(async () => {
    if (!hasSupabaseBrowserConfig()) {
      setAccountSyncError("App is not configured for sign-in.");
      return;
    }
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(GUEST_IMPORT_LOCK)) {
      return;
    }
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(GUEST_IMPORT_LOCK, "1");
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAccountSyncError("Sign in to save this draft to your account.");
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(GUEST_IMPORT_LOCK);
        }
        return;
      }

      setIsAccountImporting(true);
      setAccountSyncError(null);

      const flushed = await flushSave();
      if (!flushed) {
        setAccountSyncError(
          "Could not save your draft to this browser. Free some storage, turn off private mode, or retry — then save to your account again.",
        );
        setIsAccountImporting(false);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(GUEST_IMPORT_LOCK);
        }
        return;
      }

      const res = await importGuestDraftToProjectAction({
        wizard: contentRef.current,
        templateSlug: presentationRef.current.templateSlug,
        resumeStyle: presentationRef.current.style,
        title: presentationRef.current.title?.trim() || undefined,
      });

      if (!res.ok) {
        setAccountSyncError(res.error);
        setIsAccountImporting(false);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(GUEST_IMPORT_LOCK);
        }
        return;
      }

      clearGuestWizardDraftFromStorage();
      clearGuestPresentationFromStorage();
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(GUEST_IMPORT_LOCK);
      }
      router.replace(ROUTES.app.projectBuild(res.projectId));
    } catch {
      setAccountSyncError("Could not save your resume to your account. Try again.");
      setIsAccountImporting(false);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(GUEST_IMPORT_LOCK);
      }
    }
  }, [router, flushSave]);

  useLayoutEffect(() => {
    const raw = searchParams.get("template");
    if (!raw || templateFromUrlApplied.current) return;
    const slug = decodeURIComponent(raw.trim());
    if (!isTemplateSlug(slug)) return;
    templateFromUrlApplied.current = true;
    setPresentation((p) => ({ ...p, templateSlug: slug }));
    router.replace(ROUTES.create, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => setBrowserHasSession(Boolean(data.session)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setBrowserHasSession(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig() || !browserHasSession) return;
    const fromLogin = searchParams.get("signedIn") === "1";
    const hadLocalGuestDraft = loadGuestWizardDraftFromStorage() !== null;
    if (!fromLogin && !hadLocalGuestDraft) return;

    if (searchParams.get("signedIn") === "1") {
      router.replace(ROUTES.create, { scroll: false });
    }

    void performImportToAccount();
  }, [browserHasSession, searchParams, router, performImportToAccount]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleShareResume = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = presentation.title?.trim() || "My resume";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: "Resume draft",
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // User cancelled share or API unavailable
    }
  }, [presentation.title]);

  const handleDuplicateResume = useCallback(() => {
    const prev = snapshotNow();
    history.commit(prev, true);
    setContent(structuredClone(content));
    setPresentation((p) => ({
      ...p,
      title: p.title?.trim() ? `Copy of ${p.title}` : "Copy of Untitled resume",
    }));
  }, [content, history, snapshotNow]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <TopBar
        title={presentation.title}
        titleInputRef={titleInputRef}
        onTitleCommit={(next) => updatePresentation((p) => ({ ...p, title: next }))}
        onShare={handleShareResume}
        onDuplicate={handleDuplicateResume}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        loginHref={loginHref}
        signedIn={browserHasSession}
        saveToAccountPending={isAccountImporting}
        onSaveDraftToAccount={() => void performImportToAccount()}
        autosave={
          <AutosaveStatusChip
            context="guestDevice"
            status={saveStatus}
            lastError={lastError}
            onRetry={retry}
            isDirty={isDirty}
            surface="dark"
            layout="toolbar"
          />
        }
      />
      {isAccountImporting ? (
        <Alert className="shrink-0 rounded-none border-x-0 border-t-0 border-sky-200 bg-sky-50/95 text-sky-950 sm:rounded-none">
          <AlertTitle className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Saving to your account
          </AlertTitle>
          <AlertDescription className="text-sky-900/90">
            Copying this draft to a new resume project. You&apos;ll land in Draft with autosave to your account.
          </AlertDescription>
        </Alert>
      ) : null}
      {accountSyncError ? (
        <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0 sm:rounded-none">
          <AlertTitle>Couldn&apos;t sync yet</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 text-pretty">{accountSyncError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40 bg-background"
              disabled={isAccountImporting}
              onClick={() => void performImportToAccount()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {!isAccountImporting && !accountSyncError ? (
        <GuestDraftLocalSaveNote signedIn={browserHasSession} loginHref={loginHref} />
      ) : null}
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

const resumeMenuItemClass =
  "cursor-pointer gap-3 rounded-sm px-2 py-2.5 text-slate-700 focus-visible:bg-[#2268d7] focus-visible:text-white data-[highlighted]:bg-[#2268d7] data-[highlighted]:text-white [&_svg]:opacity-80 [&_svg]:data-[highlighted]:opacity-100 [&_svg]:data-[highlighted]:text-white";

function TopBar({
  title,
  titleInputRef,
  onTitleCommit,
  onShare,
  onDuplicate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  loginHref,
  signedIn,
  saveToAccountPending,
  onSaveDraftToAccount,
  autosave,
}: {
  title: string;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onTitleCommit: (next: string) => void;
  onShare: () => void | Promise<void>;
  onDuplicate: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  loginHref: string;
  signedIn: boolean;
  saveToAccountPending: boolean;
  onSaveDraftToAccount: () => void;
  autosave: ReactNode;
}) {
  // The title input is uncontrolled (defaultValue + remount on external change)
  // so typing stays buttery without a sync-from-props effect.
  return (
    <header className="shrink-0 border-b border-black/30 bg-[#17191d] pt-[env(safe-area-inset-top,0px)] text-white">
      {/*
        Equal `1fr | auto | 1fr` columns so the title block stays in the true horizontal
        center of the header. Autosave sits to the right of Home in the left column; both can wrap on very narrow widths.
      */}
      <div className="grid min-h-12 w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-x-2 gap-y-2 py-1.5 pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] sm:min-h-14 sm:gap-y-0 sm:py-0 sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <div className="flex min-w-0 flex-wrap content-center items-center justify-self-start gap-x-1.5 gap-y-1 sm:gap-x-2">
          <Link
            href={ROUTES.app.root}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white",
            )}
            aria-label="Go to home"
          >
            <span className="text-base leading-none">←</span>
            Home
          </Link>
          {autosave}
        </div>

        <div className="relative z-10 flex min-w-0 max-w-[min(22rem,calc(100dvw_-_15rem_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px)))] justify-self-center sm:max-w-[min(32rem,calc(100dvw_-_20rem_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px)))]">
          {/* Minimal “underline” title + sync icon — matches compact doc-editor chrome */}
          <div className="flex w-full min-w-0 items-end gap-2.5 sm:gap-3">
            <input
              ref={titleInputRef}
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
              placeholder="Untitled resume"
              className="min-w-0 flex-1 rounded-none border-0 border-b-2 border-[#3b82f6] bg-transparent px-0.5 pb-0.5 text-center text-xs font-normal text-slate-100 caret-white placeholder:text-slate-500 outline-none transition-colors selection:bg-sky-500/35 focus-visible:border-sky-300 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end justify-self-end gap-x-1 gap-y-1.5 sm:gap-x-2">
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
              className={resumeMenuItemClass}
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
            <DropdownMenuItem className={resumeMenuItemClass} onClick={() => void onShare()}>
              <UserPlus className="size-4 shrink-0" aria-hidden />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className={resumeMenuItemClass} onClick={onDuplicate}>
              <Copy className="size-4 shrink-0" aria-hidden />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {signedIn ? (
          <div className="flex w-full min-w-0 basis-full flex-wrap items-center justify-end gap-1.5 gap-y-1.5 sm:basis-auto sm:w-auto sm:max-w-[min(100%,22rem)] sm:flex-nowrap sm:gap-2">
            <Button
              type="button"
              size="sm"
              disabled={saveToAccountPending}
              onClick={onSaveDraftToAccount}
              className={cn(
                "h-8 shrink-0 gap-1.5 rounded-full border-0 bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:px-3",
              )}
              aria-label="Save this draft as a resume project in your account"
            >
              {saveToAccountPending ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <CloudUpload className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="whitespace-nowrap">Save to account</span>
            </Button>
            <Link
              href={ROUTES.app.resumes}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 shrink-0 gap-1.5 rounded-full border-white/35 bg-transparent px-2.5 text-xs font-semibold text-white hover:bg-white/10 sm:px-3",
              )}
              aria-label="Open resume projects dashboard"
            >
              <LayoutDashboard className="size-3.5 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Dashboard</span>
            </Link>
          </div>
        ) : (
          <Link
            href={loginHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 gap-1.5 rounded-full bg-[#2268d7] px-3 text-xs font-semibold hover:bg-[#1f5fca]",
            )}
            aria-label="Sign in for free to save your resume to your account and export a PDF when ready"
          >
            <UserPlus className="size-3.5" aria-hidden />
            Save to account
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}
