"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  BookOpenCheck,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  GripVertical,
  LayoutGrid,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Plus,
  SquareSplitHorizontal,
  Tag,
  Trash2,
} from "lucide-react";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResumeAiScoreCard } from "@/components/resume-preview/resume-ai-score-card";
import { GUEST_AI_PROJECT_ID } from "@/lib/ai/guest";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { useGuestWizardAutosave } from "@/hooks/use-guest-wizard-autosave";
import type { SaveStatus } from "@/hooks/use-wizard-autosave";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { TEMPLATE_SLUG_ORDER, type TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, sortTemplateSlugsPhotoCapableFirst } from "@/lib/resume-preview/template-theme";
import {
  prepareResumePhoto,
  RESUME_PHOTO_INPUT_ACCEPT,
} from "@/lib/images/prepare-resume-photo";
import { isProfileDescriptionEmpty } from "@/lib/profile-description-html";
import { createDemoWizardStateForTemplate } from "@/lib/resume-wizard/demo-wizard-state";
import { ensureEntryId } from "@/lib/resume-wizard/ids";
import { DEFAULT_GUEST_STUDIO_SECTION_ORDER } from "@/lib/resume-wizard/section-order";
import type {
  PersonalCustomLine,
  WizardEditorSectionId,
  WizardStateV1,
} from "@/lib/resume-wizard/types";
import { createEmptyWizardState } from "@/lib/resume-wizard/defaults";
import {
  getResumeReadiness,
  hasPreviewReadyResumeContent,
} from "@/lib/resume-wizard/content-readiness";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  AdditionalAiPanel,
  EducationEntryAiPanel,
  SkillsAiPanel,
  SummaryAiPanel,
} from "@/components/resume-wizard/wizard-ai-panels";
import { ExperienceBulletAiControls } from "@/components/resume-wizard/experience-bullet-ai";
import {
  ExperienceJobTailorSection,
  SkillsJobTailorSection,
  SummaryJobTailorSection,
} from "@/components/resume-wizard/job-tailor-sections";
import { ProfileDescriptionEditor } from "@/components/resume-wizard/profile-description-editor";
import { ResumeStudioSplitLayout } from "@/components/resume-wizard/resume-studio-split-layout";
import { StickyBottomBar } from "@/components/layout/sticky-bottom-bar";
import { GuestResumeUploadIntake } from "@/components/resume-wizard/guest-resume-upload-intake";
import { SelectTemplateForExampleModal } from "@/components/resume-wizard/select-template-for-example-modal";
import type { JobTailorReviewV1, TailoringCompareV1 } from "@/lib/job-target/types";
import { JobTailoringHub } from "@/components/resume-wizard/job-tailoring-hub";
import { SUPPRESS_TEXT_ASSIST } from "@/lib/suppress-text-assist";
import { cn } from "@/lib/utils";

type SectionId = WizardEditorSectionId;

type PersonalPillKey =
  | "dateOfBirth"
  | "placeOfBirth"
  | "driversLicense"
  | "gender"
  | "nationality"
  | "civilStatus"
  | "websitePill"
  | "linkedInPill";

/** Display order for optional personal fields once added (above the “add more” chips). */
const OPTIONAL_PILL_ORDER: PersonalPillKey[] = [
  "dateOfBirth",
  "placeOfBirth",
  "driversLicense",
  "gender",
  "nationality",
  "civilStatus",
  "websitePill",
  "linkedInPill",
];

const OPTIONAL_PILL_LABELS: Record<PersonalPillKey, string> = {
  dateOfBirth: "Date of birth",
  placeOfBirth: "Place of birth",
  driversLicense: "Driver's license",
  gender: "Gender",
  nationality: "Nationality",
  civilStatus: "Civil status",
  websitePill: "Website",
  linkedInPill: "LinkedIn",
};

const CUSTOM_FIELD_CHIP_LABEL = "Custom field";

const OPTIONAL_PILL_CLASS =
  "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-left text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 md:min-h-9 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs";

/** Value for `<input type="date">` — ISO `YYYY-MM-DD` or empty (ignores unparseable legacy text). */
function toHtmlDateInputValue(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1000 && year <= 9999) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return "";
}

type SectionDef = {
  id: SectionId;
  label: string;
  hint?: string;
  /** Not required for a strong resume — flagged in the UI so people don't feel obligated to fill it in. */
  optional?: boolean;
};

/** Order matches common resume/CV builders: profile → education → work → supporting sections. */
const SECTIONS: SectionDef[] = [
  { id: "personal", label: "Personal details" },
  { id: "summary", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Employment" },
  { id: "skills", label: "Skills" },
  { id: "languages", label: "Languages", optional: true },
  { id: "hobbies", label: "Hobbies", optional: true },
  { id: "courses", label: "Courses", optional: true },
  { id: "internships", label: "Internships", optional: true },
  { id: "certifications", label: "Certificates", optional: true },
  { id: "projects", label: "Projects", optional: true },
  { id: "additional", label: "Additional information" },
];

const FONT_PRESETS: { id: "sans" | "serif"; label: string; hint: string }[] = [
  { id: "sans", label: "Sans", hint: "Inter / Poppins family" },
  { id: "serif", label: "Serif", hint: "Times / Source Serif" },
];

const SIZE_PRESETS: { id: "S" | "M" | "L"; label: string; lineHeight: number }[] = [
  { id: "S", label: "Small", lineHeight: 1.25 },
  { id: "M", label: "Medium", lineHeight: 1.45 },
  { id: "L", label: "Large", lineHeight: 1.65 },
];

const SPACING_PRESETS: { id: "tight" | "cozy" | "airy"; label: string; scale: number }[] = [
  { id: "tight", label: "Tight", scale: 0.85 },
  { id: "cozy", label: "Cozy", scale: 1 },
  { id: "airy", label: "Airy", scale: 1.2 },
];

function moveSectionOrder(
  order: WizardEditorSectionId[],
  dragId: WizardEditorSectionId,
  targetId: WizardEditorSectionId,
): WizardEditorSectionId[] {
  if (dragId === targetId) return order;
  const next = order.filter((id) => id !== dragId);
  const idx = next.indexOf(targetId);
  if (idx === -1) return order;
  next.splice(idx, 0, dragId);
  return next;
}

/** Swap `id` with its neighbor in the list (keyboard / button reorder). */
function swapSectionWithNeighbor(
  order: WizardEditorSectionId[],
  id: WizardEditorSectionId,
  delta: -1 | 1,
): WizardEditorSectionId[] {
  const i = order.indexOf(id);
  if (i === -1) return order;
  const j = i + delta;
  if (j < 0 || j >= order.length) return order;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const COLOR_SWATCHES = [
  "#0f172a",
  "#1d4ed8",
  "#2268d7",
  "#0e7490",
  "#047857",
  "#b45309",
  "#b91c1c",
  "#7c3aed",
  "#db2777",
  "#334155",
];

const MOBILE_PREVIEW_TEMPLATE_SLUGS: TemplateSlug[] = [
  "professional-ats",
  "modern-professional",
  "technical-clean",
];

/** Soft inputs used in the accordion header and section bodies. */
const softInput =
  "border-0 bg-neutral-100 shadow-inner shadow-black/[0.04] transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#2268d7]/25";

/** Optional: signed-in `/build` — AI assist + job-posting tailoring (shared with the step-form module). */
export type StudioJobAssistProps = {
  projectId: string;
  hasSavedJobTarget: boolean;
  jobTailorReview: JobTailorReviewV1 | null;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
  setJobTailorReview: Dispatch<SetStateAction<JobTailorReviewV1 | null>>;
  jobTargetTitle: string | null;
  jobTargetCompany: string | null;
  jobTargetJobDescription: string | null;
  onJobTargetSaved?: (payload: {
    title: string | null;
    company: string | null;
    jobDescription: string;
  }) => void;
  onTailoringPipelineComplete?: (data: {
    tailoringCompare: TailoringCompareV1 | null;
    jobTailorReview: JobTailorReviewV1 | null;
    pipelineWarnings: string[];
    remainingFreeRuns: number | null;
  }) => void;
};

type StudioEditorProps = {
  content: WizardStateV1;
  onContentChange: Dispatch<SetStateAction<WizardStateV1>>;
  templateSlug: TemplateSlug;
  onTemplateChange: (slug: TemplateSlug) => void;
  resumeStyle: ResumeStyleV1;
  onResumeStyleChange: Dispatch<SetStateAction<ResumeStyleV1>>;
  loginHref: string;
  /**
   * `"guest"` (default): localStorage autosave + guest footer copy.
   * `"project"`: skips guest localStorage autosave (parent uses `useWizardAutosave`); preview can use
   * `previewAvatarUrl`; footer links to Preview.
   */
  persistMode?: "guest" | "project";
  /** Required when `persistMode` is `"project"` — used for PDF / export CTA. */
  projectPreviewHref?: string;
  onProjectPreviewClick?: () => void;
  projectPreviewPending?: boolean;
  projectPreviewPendingText?: string;
  projectCanDownload?: boolean;
  /** Signed avatar URL for live preview (project drafts only). */
  previewAvatarUrl?: string | null;
  jobAssist?: StudioJobAssistProps;
  aiProjectId?: string;
  showAiScoreCard?: boolean;
  showInitialStartScreen?: boolean;
  showSaveBadge?: boolean;
  showIntakeShortcuts?: boolean;
  showPreviewAction?: boolean;
  showDownloadAction?: boolean;
  onDraftStarted?: (method: "scratch" | "example" | "upload") => void;
};

/**
 * Studio-style accordion editor for guest users at `/create`.
 * All sections are visible at once (not a step-wise wizard), inspired by
 * the familiar cover-letter/resume studio UX users already know.
 *
 * Fully controlled: parent owns `content` and `resumeStyle` state so undo/redo
 * and persistence can live in one place. The right-hand preview + bottom
 * toolbar give real-time, visually immediate control over the template and
 * typography while typing.
 */
export function GuestStudioEditor({
  content,
  onContentChange,
  templateSlug,
  onTemplateChange,
  resumeStyle,
  onResumeStyleChange,
  loginHref,
  persistMode = "guest",
  projectPreviewHref,
  onProjectPreviewClick,
  projectPreviewPending = false,
  projectPreviewPendingText,
  projectCanDownload = false,
  previewAvatarUrl = null,
  jobAssist,
  aiProjectId,
  showAiScoreCard = false,
  showInitialStartScreen = false,
  showSaveBadge = true,
  showIntakeShortcuts = true,
  showPreviewAction,
  showDownloadAction = false,
  onDraftStarted,
}: StudioEditorProps) {
  const state = content;
  const setState = onContentChange;
  const aiAssistProjectId = jobAssist?.projectId ?? aiProjectId ?? GUEST_AI_PROJECT_ID;

  const guestAutosave = useGuestWizardAutosave({
    state,
    enabled: persistMode === "guest",
  });

  const previewAvatarForMap =
    persistMode === "project" ? previewAvatarUrl ?? null : null;

  /** Signed-in `/build`: defer heavy preview map (keeps typing responsive). Guest: immediate. */
  const deferredProjectState = useDeferredValue(state);
  const stateForPreview =
    persistMode === "project" ? deferredProjectState : state;

  const previewDocument = useMemo(
    () => mapWizardToPreviewDocument(stateForPreview, { avatarUrl: previewAvatarForMap }),
    [stateForPreview, previewAvatarForMap],
  );

  const sectionOrderResolved = useMemo(
    () => state.layout.sectionOrder ?? [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
    [state.layout.sectionOrder],
  );

  const exportHref =
    persistMode === "project" && projectPreviewHref
      ? projectPreviewHref
      : loginHref;

  // Only one section is expanded at a time — keeps the left panel calm and focused.
  const [openSection, setOpenSection] = useState<SectionId | null>("personal");
  /** When set (e.g. from intake shortcuts), Personal details opens optional pills like LinkedIn. */
  const [personalPillOpenRequest, setPersonalPillOpenRequest] = useState<{
    id: number;
    keys: PersonalPillKey[];
  } | null>(null);
  const [selectExampleTemplateOpen, setSelectExampleTemplateOpen] = useState(false);
  const [sectionLabelOverrides, setSectionLabelOverrides] = useState<
    Partial<Record<SectionId, string>>
  >({});
  const [editingSectionTitleId, setEditingSectionTitleId] = useState<SectionId | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState("");
  /**
   * Native DnD: active row + hover target for highlights only.
   * List order must stay on `sectionOrderResolved` while dragging — reordering the DOM
   * mid-drag unmounts the draggable grip and cancels the drag in the browser.
   */
  const [sectionReorderDrag, setSectionReorderDrag] = useState<{
    activeId: SectionId | null;
    overId: SectionId | null;
  }>({ activeId: null, overId: null });
  /** Set synchronously in dragstart so dragover (same tick) still sees the active id. */
  const sectionDragActiveRef = useRef<SectionId | null>(null);
  /**
   * `dragstart.target` is the draggable drag source, not the element under the pointer.
   * We record the pointerdown target (capture) so we can block drags that began on real
   * controls while still allowing drags from empty chrome inside expanded bodies.
   */
  const sectionListPointerDownRef = useRef<{
    sectionId: SectionId;
    target: Element;
  } | null>(null);

  const clearSectionReorderDrag = useCallback(() => {
    sectionListPointerDownRef.current = null;
    sectionDragActiveRef.current = null;
    setSectionReorderDrag({ activeId: null, overId: null });
  }, []);

  const orderedSections = useMemo((): SectionDef[] => {
    return sectionOrderResolved
      .map((id) => SECTIONS.find((s) => s.id === id))
      .filter((s): s is SectionDef => Boolean(s));
  }, [sectionOrderResolved]);

  const resumeProgress = useMemo(() => {
    let started = 0;
    let complete = 0;
    for (const sid of sectionOrderResolved) {
      const level = getSectionCompletion(sid, state);
      if (level !== "empty") started += 1;
      if (level === "complete") complete += 1;
    }
    return { started, complete, total: sectionOrderResolved.length };
  }, [sectionOrderResolved, state]);

  // Mobile-only: editor is shown by default; preview is reachable via a toggle
  // so the entire screen never needs to scroll beyond the viewport.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const firstResumeSoftIssue = useMemo(() => getFirstResumeSoftIssue(state), [state]);
  const previewableContent = useMemo(() => hasPreviewReadyResumeContent(state), [state]);
  const resumeReadiness = useMemo(() => getResumeReadiness(state), [state]);
  const readinessItems = [
    ...resumeReadiness.missingItems,
    ...resumeReadiness.recommendedItems,
  ];
  const mobilePreviewActionVisible = showPreviewAction ?? previewableContent;
  const mobileDownloadActionVisible =
    persistMode === "project" &&
    Boolean(onProjectPreviewClick) &&
    (projectCanDownload || (showDownloadAction && resumeReadiness.isExportReady));
  const showMobileReadinessCard =
    persistMode === "project" && mobilePreviewOpen && !projectCanDownload && !resumeReadiness.isExportReady;
  const readinessWarningTrackedRef = useRef(false);

  useEffect(() => {
    if (!showMobileReadinessCard || readinessWarningTrackedRef.current) return;
    readinessWarningTrackedRef.current = true;
    trackClientEvent(ANALYTICS_EVENTS.RESUME_READINESS_WARNING_SHOWN, {
      surface: "project_build_mobile_preview",
      missing_count: resumeReadiness.missingItems.length,
      recommended_count: resumeReadiness.recommendedItems.length,
    });
  }, [resumeReadiness.missingItems.length, resumeReadiness.recommendedItems.length, showMobileReadinessCard]);

  const scrollStudioSectionIntoView = useCallback((sectionId: SectionId) => {
    setOpenSection(sectionId);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(`studio-section-${sectionId}`)?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }, []);

  const handleImproveWithAiFromPreview = useCallback(() => {
    trackClientEvent(ANALYTICS_EVENTS.IMPROVE_WITH_AI_FROM_PREVIEW_CLICKED, {
      surface: "project_build_mobile_preview",
    });
    setMobilePreviewOpen(false);
    window.requestAnimationFrame(() => {
      const review = document.getElementById("studio-final-ai-review");
      if (review) {
        review.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      setOpenSection("summary");
      document.getElementById("studio-section-summary")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const toggleSection = useCallback((id: SectionId) => {
    setOpenSection((cur) => (cur === id ? null : id));
  }, []);

  const applyExampleForTemplate = useCallback(
    (slug: TemplateSlug) => {
      trackClientEvent(ANALYTICS_EVENTS.START_FROM_EXAMPLE_CLICKED, {
        template: slug,
        surface: "guest_create",
      });
      setState(createDemoWizardStateForTemplate(slug));
      onTemplateChange(slug);
      onDraftStarted?.("example");
      setOpenSection("personal");
      setSelectExampleTemplateOpen(false);
    },
    [setState, onTemplateChange, onDraftStarted],
  );

  const handleResumeImported = useCallback(
    (wizard: WizardStateV1) => {
      setState(wizard);
      onDraftStarted?.("upload");
      setOpenSection("personal");
    },
    [setState, onDraftStarted],
  );

  const handleUploadPickerOpen = useCallback(() => {
    trackClientEvent(ANALYTICS_EVENTS.UPLOAD_RESUME_CLICKED, {
      surface: "guest_create",
    });
  }, []);

  const handleStartFromScratch = useCallback(() => {
    trackClientEvent(ANALYTICS_EVENTS.START_FROM_SCRATCH_CLICKED, {
      surface: "guest_create",
    });
    setState(createEmptyWizardState());
    onDraftStarted?.("scratch");
    setOpenSection("personal");
  }, [onDraftStarted, setState]);

  const handleLinkedInIntakeShortcut = useCallback(() => {
    setOpenSection("personal");
    setPersonalPillOpenRequest({
      id: typeof performance !== "undefined" ? performance.now() : Date.now(),
      keys: ["linkedInPill"],
    });
  }, []);

  const commitSectionTitle = useCallback((sectionId: SectionId, defaultLabel: string) => {
    const trimmed = sectionTitleDraft.trim();
    setSectionLabelOverrides((prev) => {
      if (!trimmed || trimmed === defaultLabel) {
        const { [sectionId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [sectionId]: trimmed };
    });
    setEditingSectionTitleId(null);
  }, [sectionTitleDraft]);

  const cancelSectionTitleEdit = useCallback(() => {
    setEditingSectionTitleId(null);
  }, []);

  useEffect(() => {
    if (editingSectionTitleId === null) return;
    if (openSection !== editingSectionTitleId) {
      setEditingSectionTitleId(null);
    }
  }, [openSection, editingSectionTitleId]);

  /** Append a module block to Additional information and open that section. */
  const appendAdditionalModule = useCallback(
    (heading: string, starter: string) => {
      setState((s) => {
        const cur = s.additional.notes.trim();
        const block = cur.length ? `${cur}\n\n${heading}\n${starter}` : `${heading}\n${starter}`;
        return { ...s, additional: { notes: block } };
      });
      setOpenSection("additional");
      requestAnimationFrame(() => {
        const ta = document.getElementById("additional");
        if (ta && ta instanceof HTMLTextAreaElement) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      });
    },
    [setState],
  );

  // Bottom preview toolbar state.
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [advancedStyleOpen, setAdvancedStyleOpen] = useState(false);
  /** While hovering a template in the strip, preview uses this slug without committing. */
  const [templateHoverSlug, setTemplateHoverSlug] = useState<TemplateSlug | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  /** Mobile preview zoom: 75% or 100%, adjustable via the +/- controls. */
  const [previewZoom, setPreviewZoom] = useState<75 | 100>(100);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const templateStripScrollRef = useRef<HTMLDivElement | null>(null);
  /** Arrow affordances replace a subtle native scrollbar for the template row. */
  const [templateStripArrows, setTemplateStripArrows] = useState({
    canLeft: false,
    canRight: false,
  });

  const currentSize =
    SIZE_PRESETS.find((p) => Math.abs((resumeStyle.lineHeight ?? 1.45) - p.lineHeight) < 0.02) ??
    SIZE_PRESETS[1];
  const currentSpacing =
    SPACING_PRESETS.find((p) => Math.abs((resumeStyle.sectionGapScale ?? 1) - p.scale) < 0.02) ??
    SPACING_PRESETS[1];
  const currentFont = FONT_PRESETS.find((p) => p.id === (resumeStyle.fontFamily ?? "sans"))
    ?? FONT_PRESETS[0];
  const currentColor = resumeStyle.accent ?? COLOR_SWATCHES[0];
  const previewTemplateSlug = templateHoverSlug ?? templateSlug;
  const previewTheme = getTemplateTheme(previewTemplateSlug);
  const templateName = previewTheme.name;
  const previewTemplateChoices =
    persistMode === "project"
      ? MOBILE_PREVIEW_TEMPLATE_SLUGS
      : sortTemplateSlugsPhotoCapableFirst([...TEMPLATE_SLUG_ORDER]);

  /** Flags sections that still hold untouched "Start with an example" sample content, so we can mark it as replaceable/removable. */
  const templateDemoState = useMemo(
    () => createDemoWizardStateForTemplate(templateSlug),
    [templateSlug],
  );
  const exampleContentFlags = {
    languages:
      state.languages.lines.trim() !== "" &&
      state.languages.lines === templateDemoState.languages.lines,
    hobbies:
      state.hobbies.lines.trim() !== "" &&
      state.hobbies.lines === templateDemoState.hobbies.lines,
    certifications: entryListMatchesExample(
      state.certifications.entries,
      templateDemoState.certifications.entries,
      ["name", "issuer", "issued", "expires"],
    ),
    projects: entryListMatchesExample(
      state.projects.entries,
      templateDemoState.projects.entries,
      ["name", "url", "description", "technologies"],
    ),
  };

  // Close any open popover when clicking elsewhere.
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!fontOpen && !sizeOpen && !spacingOpen && !colorOpen && !templatesOpen) return;
    function handleDown(e: MouseEvent) {
      if (!toolbarRef.current) return;
      if (toolbarRef.current.contains(e.target as Node)) return;
      setFontOpen(false);
      setSizeOpen(false);
      setSpacingOpen(false);
      setColorOpen(false);
      setTemplatesOpen(false);
      setTemplateHoverSlug(null);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [fontOpen, sizeOpen, spacingOpen, colorOpen, templatesOpen]);

  // Vertical wheel / trackpad pans the template row horizontally (native passive:on would block preventDefault).
  useEffect(() => {
    if (!templatesOpen) return;
    const node = templateStripScrollRef.current;
    if (!node) return;

    function onWheel(e: WheelEvent) {
      const el = templateStripScrollRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const dx = e.deltaX;
      const dy = e.deltaY;
      if (Math.abs(dx) > Math.abs(dy)) {
        el.scrollLeft += dx;
      } else {
        el.scrollLeft += dy;
      }
      e.preventDefault();
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [templatesOpen]);

  const updateTemplateStripArrows = useCallback(() => {
    const el = templateStripScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setTemplateStripArrows({
      canLeft: scrollLeft > 2,
      canRight: maxScroll > 2 && scrollLeft < maxScroll - 2,
    });
  }, []);

  useLayoutEffect(() => {
    if (!templatesOpen) return;
    const el = templateStripScrollRef.current;
    if (!el) return;

    updateTemplateStripArrows();
    const onScroll = () => updateTemplateStripArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateTemplateStripArrows());
    ro.observe(el);
    const id = window.requestAnimationFrame(() => {
      updateTemplateStripArrows();
      document.getElementById(`guest-template-thumb-${templateSlug}`)?.scrollIntoView({
        inline: "center",
        block: "nearest",
      });
      window.requestAnimationFrame(updateTemplateStripArrows);
    });
    return () => {
      window.cancelAnimationFrame(id);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [templatesOpen, templateSlug, updateTemplateStripArrows]);

  function scrollTemplateStrip(direction: -1 | 1) {
    const el = templateStripScrollRef.current;
    if (!el) return;
    const delta = Math.max(120, Math.floor(el.clientWidth * 0.72)) * direction;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  /** Scroll the preview so the block for the open studio section stays in view. */
  useLayoutEffect(() => {
    if (openSection == null) return;
    const root = previewScrollRef.current;
    if (!root) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const el = root.querySelector<HTMLElement>(
        `[data-studio-section="${openSection}"]`,
      );
      if (!el) return;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
    };
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [openSection, previewDocument, previewTemplateSlug]);

  if (showInitialStartScreen) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col px-3 py-4 pb-safe min-[380px]:px-4 sm:px-6 sm:py-8">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-950/[0.03] min-[380px]:p-5 sm:p-7">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#2268d7]">
              Start free
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Create your resume
            </h1>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Build a professional, ATS-friendly resume with AI help. Start free — no account required.
            </p>
          </div>

          <div className="mt-4 sm:mt-5">
            <GuestStartMethodCards
              onStartFromScratch={handleStartFromScratch}
              onOpenSelectExampleTemplate={() => setSelectExampleTemplateOpen(true)}
              resumeUpload={
                <GuestResumeUploadIntake
                  templateSlug={templateSlug}
                  onImported={handleResumeImported}
                  onPickerOpen={handleUploadPickerOpen}
                  cardClassName="flex min-h-[5.75rem] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left outline-none transition-[border-color,box-shadow,transform] duration-200 min-[380px]:min-h-[6.25rem] min-[380px]:px-4 min-[380px]:py-4"
                />
              }
            />
          </div>

          <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-pretty text-sm leading-relaxed text-slate-600 shadow-sm sm:mt-5">
            Your information stays private. Create an account later to save across devices and download your final PDF.
          </p>
        </div>

        <SelectTemplateForExampleModal
          open={selectExampleTemplateOpen}
          onOpenChange={setSelectExampleTemplateOpen}
          currentSlug={templateSlug}
          onSelectTemplate={applyExampleForTemplate}
        />
      </div>
    );
  }

  return (
    <ResumeStudioSplitLayout
      focusMode={focusMode}
      mobilePreviewOpen={mobilePreviewOpen}
      previewAccent={previewTheme.accent}
      editor={(
        <div
          className={cn(
            "w-full min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 lg:pb-5",
            mobilePreviewActionVisible || mobileDownloadActionVisible ? "pb-28" : "pb-safe",
          )}
        >
          {persistMode === "project" ? (
            <MobileModeSwitch
              active="build"
              previewEnabled={mobilePreviewActionVisible}
              onBuild={() => {
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_BUILD_TAB_SELECTED, {
                  surface: "project_build_mobile",
                });
                setMobilePreviewOpen(false);
              }}
              onPreview={() => {
                if (!mobilePreviewActionVisible) return;
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_PREVIEW_TAB_SELECTED, {
                  surface: "project_build_mobile",
                });
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_PREVIEW_CLICKED, {
                  surface: "builder_mode_switch",
                });
                setMobilePreviewOpen(true);
              }}
            />
          ) : null}

          {persistMode === "guest" && showSaveBadge ? (
            <SaveBadge
              status={guestAutosave.saveStatus}
              error={guestAutosave.lastError}
              onRetry={guestAutosave.retry}
              isDirty={guestAutosave.isDirty}
            />
          ) : null}

          {showIntakeShortcuts ? (
            <IntakeShortcuts
              onOpenSelectExampleTemplate={() => setSelectExampleTemplateOpen(true)}
              resumeUpload={
                <GuestResumeUploadIntake
                  templateSlug={templateSlug}
                  onImported={handleResumeImported}
                  onPickerOpen={handleUploadPickerOpen}
                  cardClassName="flex min-h-[7.75rem] w-full flex-col items-center justify-center gap-3 rounded-xl border px-4 py-4 text-center outline-none transition-[border-color,box-shadow,transform] duration-200 sm:min-h-[8.25rem] sm:gap-3.5 sm:py-5"
                />
              }
              onLinkedInImport={handleLinkedInIntakeShortcut}
            />
          ) : null}

          <SelectTemplateForExampleModal
            open={selectExampleTemplateOpen}
            onOpenChange={setSelectExampleTemplateOpen}
            currentSlug={templateSlug}
            onSelectTemplate={applyExampleForTemplate}
          />

          <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:px-4 sm:py-3.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Resume progress</p>
                <p className="text-xs text-muted-foreground">
                  {resumeProgress.started} of {resumeProgress.total} sections started ·{" "}
                  {resumeProgress.complete} looking interview-ready
                </p>
              </div>
              {previewableContent ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#2268d7] underline-offset-4 hover:underline lg:hidden"
                  onClick={() => {
                    trackClientEvent(ANALYTICS_EVENTS.PREVIEW_RESUME_CLICKED, {
                      surface: "guest_create_progress",
                    });
                    setMobilePreviewOpen(true);
                  }}
                >
                  Quick preview
                </button>
              ) : null}
            </div>
            <div
              className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={resumeProgress.complete}
              aria-valuemin={0}
              aria-valuemax={resumeProgress.total}
              aria-label="Sections marked interview-ready"
            >
              <div
                className="h-full rounded-full bg-[#2268d7] transition-[width] duration-300 ease-out"
                style={{
                  width: `${resumeProgress.total ? (resumeProgress.complete / resumeProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {persistMode === "project" && jobAssist ? (
            <JobTailoringHub
              projectId={jobAssist.projectId}
              onPreviewClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_PREVIEW_CLICKED, {
                  surface: "job_tailoring_hub",
                });
                setMobilePreviewOpen(true);
              }}
              hasSavedJobTarget={jobAssist.hasSavedJobTarget}
              jobTargetTitle={jobAssist.jobTargetTitle}
              jobTargetCompany={jobAssist.jobTargetCompany}
              jobTargetJobDescription={jobAssist.jobTargetJobDescription}
              jobTailorReview={jobAssist.jobTailorReview}
              onJobTargetSaved={jobAssist.onJobTargetSaved}
              onTailoringPipelineComplete={jobAssist.onTailoringPipelineComplete}
            />
          ) : null}

          <nav
            className={cn(
              "flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-slate-100/80 p-2 sm:gap-2.5 sm:p-2.5 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
              sectionReorderDrag.activeId &&
                "bg-emerald-50/35 shadow-[inset_0_0_0_1px_rgba(45,159,109,0.18)]",
            )}
            aria-label="Resume sections"
          >
            {orderedSections.map((section) => {
              const idx = sectionOrderResolved.indexOf(section.id);
              const canMoveUp = idx > 0;
              const canMoveDown = idx >= 0 && idx < sectionOrderResolved.length - 1;
              const isDragging = Boolean(sectionReorderDrag.activeId);
              const isDragSource = sectionReorderDrag.activeId === section.id;
              const isDropTarget =
                isDragging &&
                sectionReorderDrag.overId === section.id &&
                sectionReorderDrag.activeId !== section.id;
              const isDragContextRow = isDragging && !isDragSource && !isDropTarget;
              const beginSectionListDrag = (e: DragEvent<HTMLElement>) => {
                const ptr = sectionListPointerDownRef.current;
                const pointerIntent =
                  ptr?.sectionId === section.id ? ptr.target : null;
                const dragSource =
                  e.currentTarget instanceof Element ? e.currentTarget : null;
                if (!sectionRowDragAllowed(pointerIntent, dragSource)) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData("text/plain", section.id);
                e.dataTransfer.effectAllowed = "move";
                sectionDragActiveRef.current = section.id;
                setSectionReorderDrag({ activeId: section.id, overId: null });
              };
              return (
              <div
                key={section.id}
                id={`studio-section-${section.id}`}
                draggable={true}
                aria-grabbed={isDragSource}
                aria-label={`${section.label} — drag to reorder`}
                title="Drag this card to reorder sections"
                onPointerDownCapture={(e: PointerEvent<HTMLDivElement>) => {
                  if (e.target instanceof Element) {
                    sectionListPointerDownRef.current = {
                      sectionId: section.id,
                      target: e.target,
                    };
                  }
                }}
                onDragStart={beginSectionListDrag}
                onDragEnd={clearSectionReorderDrag}
                className={cn(
                  "cursor-grab overflow-hidden rounded-xl border motion-safe:transition-[background-color,box-shadow,opacity,transform] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] active:cursor-grabbing",
                  !isDragging && "border-slate-200/90 bg-white shadow-sm",
                  !isDragging && "hover:border-slate-300/90 hover:shadow",
                  isDragContextRow && "border-slate-200/80 bg-white/95 shadow-sm",
                  isDragSource &&
                    "relative z-[1] cursor-grabbing border-[#2d9f6d] bg-white opacity-[0.92] shadow-[0_10px_40px_-10px_rgba(45,159,109,0.55)]",
                  isDropTarget &&
                    "border-2 border-dashed border-[#2d9f6d]/70 bg-emerald-50/95 shadow-[0_0_0_3px_rgba(45,159,109,0.12)]",
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setSectionReorderDrag((prev) => {
                    const activeId = prev.activeId ?? sectionDragActiveRef.current;
                    if (!activeId) return prev;
                    if (prev.activeId === activeId && prev.overId === section.id) return prev;
                    return { ...prev, activeId, overId: section.id };
                  });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragId = e.dataTransfer.getData("text/plain") as WizardEditorSectionId;
                  if (!dragId || dragId === section.id) return;
                  setState((s) => ({
                    ...s,
                    layout: {
                      ...s.layout,
                      v: 1,
                      sectionOrder: moveSectionOrder(
                        s.layout.sectionOrder ?? [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
                        dragId,
                        section.id,
                      ),
                    },
                  }));
                }}
              >
              <SectionCard
                section={section}
                displayLabel={sectionLabelOverrides[section.id] ?? section.label}
                completion={getSectionCompletion(section.id, state)}
                onNativeSectionDragStart={beginSectionListDrag}
                onNativeSectionDragEnd={clearSectionReorderDrag}
                open={openSection === section.id}
                onToggle={() => toggleSection(section.id)}
                titleEditing={editingSectionTitleId === section.id}
                titleDraft={sectionTitleDraft}
                onTitleDraftChange={setSectionTitleDraft}
                onTitleCommit={() => commitSectionTitle(section.id, section.label)}
                onTitleCancel={cancelSectionTitleEdit}
                isSectionDragSource={isDragSource}
                isSectionDropTarget={isDropTarget}
                isSectionDragContext={isDragContextRow}
                sectionReorder={{
                  /* Keep chevrons mounted while dragging — unmounting them on dragstart
                   * mutates the row mid-gesture and can cancel native HTML5 drag. */
                  canMoveUp: canMoveUp && !sectionReorderDrag.activeId,
                  canMoveDown: canMoveDown && !sectionReorderDrag.activeId,
                  onMoveUp: () =>
                    setState((s) => ({
                      ...s,
                      layout: {
                        ...s.layout,
                        v: 1,
                        sectionOrder: swapSectionWithNeighbor(
                          s.layout.sectionOrder ??
                            [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
                          section.id,
                          -1,
                        ),
                      },
                    })),
                  onMoveDown: () =>
                    setState((s) => ({
                      ...s,
                      layout: {
                        ...s.layout,
                        v: 1,
                        sectionOrder: swapSectionWithNeighbor(
                          s.layout.sectionOrder ??
                            [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
                          section.id,
                          1,
                        ),
                      },
                    })),
                }}
                headerMenu={
                  openSection === section.id ? (
                    <SectionOverflowMenu
                      section={section}
                      onBeginRename={() => {
                        setEditingSectionTitleId(section.id);
                        setSectionTitleDraft(sectionLabelOverrides[section.id] ?? section.label);
                      }}
                      pageBreak={Boolean(state.layout.pageBreakBefore[section.id])}
                      onPageBreakChange={(next) =>
                        setState((s) => {
                          const pageBreakBefore = { ...s.layout.pageBreakBefore };
                          if (next) pageBreakBefore[section.id] = true;
                          else delete pageBreakBefore[section.id];
                          return {
                            ...s,
                            layout: {
                              ...s.layout,
                              v: 1,
                              pageBreakBefore,
                              sectionOrder:
                                s.layout.sectionOrder ?? [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
                            },
                          };
                        })
                      }
                      showNameIn={state.personal.showNameIn}
                      onShowNameInChange={(value) =>
                        setState((s) => ({
                          ...s,
                          personal: { ...s.personal, showNameIn: value },
                        }))
                      }
                      canRemovePhoto={Boolean(state.personal.photoDataUrl)}
                      onRemovePhoto={() =>
                        setState((s) => ({
                          ...s,
                          personal: { ...s.personal, photoDataUrl: "" },
                        }))
                      }
                    />
                  ) : null
                }
              >
                <SectionBody
                  section={section.id}
                  state={state}
                  setState={setState}
                  loginHref={loginHref}
                  jobAssist={jobAssist}
                  aiAssistProjectId={aiAssistProjectId}
                  personalPillOpenRequest={personalPillOpenRequest}
                  exampleContentFlags={exampleContentFlags}
                />
              </SectionCard>
              </div>
            );
            })}
          </nav>

          {/*
            The moment the form ends, the download is the next thing you see —
            ahead of the AI review and the optional "add a section" pills. The
            header pill is too easy to scroll past to be the only way out.
          */}
          {persistMode === "project" && onProjectPreviewClick ? (
            <div className="mt-8">
              <Button
                type="button"
                disabled={projectPreviewPending}
                aria-busy={projectPreviewPending}
                aria-label={
                  projectCanDownload ? "Download resume" : "Download resume — continues to checkout"
                }
                className="h-14 min-h-14 w-full gap-2.5 rounded-xl bg-[#2268d7] text-base font-semibold text-white shadow-lg shadow-[#2268d7]/25 transition-colors hover:bg-[#1f5fca] disabled:cursor-wait disabled:opacity-75"
                onClick={onProjectPreviewClick}
              >
                {projectPreviewPending ? (
                  <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-5 shrink-0" aria-hidden />
                )}
                {projectPreviewPending
                  ? (projectPreviewPendingText ?? "Preparing PDF...")
                  : "Download resume"}
              </Button>
              <p className="mt-2 text-center text-xs leading-snug text-muted-foreground">
                {projectCanDownload
                  ? "Your PDF export is unlocked."
                  : "Preview is free · Pay once to download your PDF"}
              </p>
            </div>
          ) : null}

          {persistMode === "project" && showAiScoreCard ? (
            <div className="mt-6" id="studio-final-ai-review">
              <ResumeAiScoreCard
                projectId={aiAssistProjectId}
                variant="studio"
                onDownload={onProjectPreviewClick}
                downloadPending={projectPreviewPending}
                downloadPendingText={projectPreviewPendingText}
              />
            </div>
          ) : null}

          <footer className="mt-6 border-t border-neutral-200/90 pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                <ModulePill
                  label="Extracurricular activities"
                  onClick={() =>
                    appendAdditionalModule("Extracurricular activities", "• ")
                  }
                />
                <ModulePill
                  label="References"
                  onClick={() =>
                    appendAdditionalModule(
                      "References",
                      "Name, role — email — relationship\n• ",
                    )
                  }
                />
                <ModulePill
                  label="Qualities"
                  onClick={() => appendAdditionalModule("Qualities", "• ")}
                />
                <ModulePill
                  label="Achievements"
                  onClick={() => appendAdditionalModule("Achievements", "• ")}
                />
                <ModulePill
                  label="Signature"
                  onClick={() =>
                    appendAdditionalModule(
                      "Signature",
                      "Signed,\n[Your name]\nDate / Place",
                    )
                  }
                />
                <ModulePill
                  label="Footer"
                  onClick={() =>
                    appendAdditionalModule(
                      "Footer",
                      "Optional line for licenses, links, or disclosures.",
                    )
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 shadow-sm outline-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 md:min-h-0 md:gap-1 md:px-3 md:py-1.5 md:text-xs"
                  >
                    <Plus className="size-3.5 shrink-0 stroke-neutral-500" aria-hidden />
                    Custom section
                    <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[13rem]">
                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      onClick={() =>
                        appendAdditionalModule("Custom", "Add your content here.\n\n")
                      }
                    >
                      Blank section
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      onClick={() =>
                        appendAdditionalModule(
                          "Custom — two columns",
                          "Left column:\n\nRight column:\n\n",
                        )
                      }
                    >
                      Two-column note
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      onClick={() =>
                        appendAdditionalModule(
                          "Custom — checklist",
                          "☐ \n☐ \n☐ \n",
                        )
                      }
                    >
                      Checklist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {persistMode === "project" ? null : (
                <Link
                  href={exportHref}
                  className={cn(
                    "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-end rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f5fca] sm:self-auto",
                  )}
                  aria-label="Sign in to download as PDF"
                >
                  <Download className="size-4 shrink-0" aria-hidden />
                  Download resume
                </Link>
              )}
            </div>

          </footer>

          <p className="pt-4 pb-28 text-center text-xs text-muted-foreground lg:pb-10">
            {persistMode === "guest" ? (
              <>
                Saved to this device only.{" "}
                <Link
                  href={loginHref}
                  className="font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to save to your account and download PDFs.
              </>
            ) : (
              <>
                Draft content saves automatically to this project. Use the live preview while you edit.
              </>
            )}
          </p>
        </div>
      )}
      preview={(
        <>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4 sm:px-5 sm:py-5">
          {persistMode === "project" ? (
            <MobileModeSwitch
              active="preview"
              previewEnabled={mobilePreviewActionVisible}
              onBuild={() => {
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_BUILD_TAB_SELECTED, {
                  surface: "project_build_mobile",
                });
                setMobilePreviewOpen(false);
              }}
              onPreview={() => {
                trackClientEvent(ANALYTICS_EVENTS.MOBILE_PREVIEW_TAB_SELECTED, {
                  surface: "project_build_mobile",
                });
                setMobilePreviewOpen(true);
              }}
            />
          ) : null}

          {showMobileReadinessCard ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 text-amber-950 shadow-sm lg:hidden">
              <p className="text-sm font-semibold">Your resume needs a little more work</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-950/80">
                Add or improve the sections below before downloading a professional final PDF.
              </p>
              {readinessItems.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-amber-950/85">
                  {readinessItems.slice(0, 4).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-10 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => setMobilePreviewOpen(false)}
                >
                  Continue editing
                </Button>
                {showAiScoreCard ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 bg-white"
                    onClick={handleImproveWithAiFromPreview}
                  >
                    Improve with AI
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Floating controls — not part of the template; keeps the canvas = one real sheet */}
          <div className="pointer-events-none absolute right-4 top-[4.75rem] z-50 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 sm:right-6 lg:top-5">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-white/95 p-1 text-[0.7rem] font-medium text-muted-foreground shadow-md backdrop-blur-sm dark:bg-zinc-900/95 dark:text-zinc-200">
              <button
                type="button"
                onClick={() => setPreviewZoom(75)}
                disabled={previewZoom === 75}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Zoom out to 75%"
              >
                <Minus className="size-3.5 shrink-0" aria-hidden />
              </button>
              <span className="min-w-[2.75rem] text-center text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {previewZoom}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                disabled={previewZoom === 100}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Zoom in to 100%"
              >
                <Plus className="size-3.5 shrink-0" aria-hidden />
              </button>
              {focusMode ? (
                <button
                  type="button"
                  onClick={() => setFocusMode(false)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                  aria-label="Exit focus mode"
                >
                  <Minimize2 className="size-3.5 shrink-0" aria-hidden />
                  Exit focus
                </button>
              ) : null}
            </div>
          </div>

          <div className="mx-auto flex min-h-0 w-full max-w-[min(780px,100%)] flex-1 flex-col">
            <div
              ref={previewScrollRef}
              className="relative min-h-0 w-full flex-1 cursor-default overflow-y-auto overflow-x-auto px-1 pb-10 pt-32 sm:px-2 lg:pt-10"
            >
              <div
                className="inline-block origin-top-left py-2 sm:px-1"
                style={{
                  transform: previewZoom === 75 ? "scale(0.75)" : undefined,
                  transformOrigin: "top left",
                }}
              >
                <PreviewViewport presentation="document" clipCanvas={false}>
                  <ResumePreviewRenderer
                    document={previewDocument}
                    templateSlug={previewTemplateSlug}
                    resumeStyle={resumeStyle}
                    studioFocusSection={mobilePreviewOpen ? null : openSection}
                  />
                </PreviewViewport>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom preview toolbar — template strip is absolutely positioned so it does not shrink the preview column */}
        <div
          ref={toolbarRef}
          className={cn(
            "sticky bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md",
            mobilePreviewOpen &&
              "max-lg:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]",
          )}
        >
          <div className="relative mx-auto max-w-[780px] px-2 py-2 sm:px-4">
            {templatesOpen ? (
              <div
                className="absolute bottom-full left-0 right-0 z-40 mb-2 px-2 sm:px-4"
                onMouseLeave={() => setTemplateHoverSlug(null)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setTemplateHoverSlug(null);
                  }
                }}
              >
                <div className="mx-auto max-w-[780px] rounded-lg border border-border/80 bg-white px-1.5 py-2 shadow-sm sm:px-2 sm:py-2.5">
                  <div className="relative py-0.5">
                    {templateStripArrows.canLeft ? (
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-14 bg-gradient-to-r from-white from-35% to-transparent sm:w-16"
                        aria-hidden
                      />
                    ) : null}
                    {templateStripArrows.canRight ? (
                      <div
                        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-14 bg-gradient-to-l from-white from-35% to-transparent sm:w-16"
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => scrollTemplateStrip(-1)}
                      disabled={!templateStripArrows.canLeft}
                      aria-label="Show previous templates"
                      className={cn(
                        "absolute left-1 top-1/2 z-20 flex size-11 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-800 shadow-[0_4px_18px_rgba(15,23,42,0.14),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-sm outline-none transition-[transform,box-shadow,background-color,border-color,opacity] sm:left-1.5 md:size-10 md:min-h-0 md:min-w-0",
                        "hover:border-slate-300/90 hover:bg-white hover:shadow-[0_6px_22px_rgba(15,23,42,0.16)]",
                        "active:scale-[0.96]",
                        "focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        "disabled:pointer-events-none disabled:opacity-30",
                      )}
                    >
                      <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
                    </button>
                    <div
                      ref={templateStripScrollRef}
                      className={cn(
                        "min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth py-0.5",
                        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0",
                      )}
                    >
                      <div className="flex w-max min-w-full flex-nowrap justify-center gap-3 px-11 sm:gap-4 sm:px-12">
                    {previewTemplateChoices.map((slug) => {
                      const theme = getTemplateTheme(slug);
                      const selected = slug === templateSlug;
                      const hovered = templateHoverSlug === slug;
                      return (
                        <button
                          key={slug}
                          id={`guest-template-thumb-${slug}`}
                          type="button"
                          onMouseEnter={() => setTemplateHoverSlug(slug)}
                          onFocus={() => setTemplateHoverSlug(slug)}
                          onClick={() => {
                            onTemplateChange(slug);
                            setTemplatesOpen(false);
                            setTemplateHoverSlug(null);
                          }}
                          style={{
                            backgroundColor: hovered
                              ? `color-mix(in srgb, ${theme.accent} 18%, white)`
                              : undefined,
                          }}
                          className={cn(
                            "flex min-h-[7.5rem] min-w-[5.75rem] shrink-0 flex-col items-center gap-2 rounded-xl p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-lg sm:p-1",
                            !hovered && "hover:bg-slate-50",
                          )}
                        >
                          <div
                            className={cn(
                              "relative w-[5rem] overflow-hidden rounded bg-white sm:w-[5.5rem] aspect-[210/297]",
                              selected
                                ? "border-2 border-[#2268d7]"
                                : "border border-slate-200/90",
                            )}
                            style={{ borderLeft: `3px solid ${theme.accent}` }}
                          >
                            <TemplateCatalogLivePreview
                              slug={slug}
                              className="absolute inset-0 h-full w-full rounded-none shadow-none ring-0"
                            />
                          </div>
                          <span className="max-w-[6rem] text-center text-xs font-semibold leading-tight whitespace-normal break-words text-slate-800 sm:max-w-[5.5rem]">
                            {theme.name}
                          </span>
                          <span className="max-w-[6.5rem] text-center text-[0.65rem] leading-tight text-muted-foreground sm:hidden">
                            {slug === "professional-ats" ? "ATS-friendly" : theme.bestFor.split(",")[0]}
                          </span>
                        </button>
                      );
                    })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollTemplateStrip(1)}
                      disabled={!templateStripArrows.canRight}
                      aria-label="Show more templates"
                      className={cn(
                        "absolute right-1 top-1/2 z-20 flex size-11 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-800 shadow-[0_4px_18px_rgba(15,23,42,0.14),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-sm outline-none transition-[transform,box-shadow,background-color,border-color,opacity] sm:right-1.5 md:size-10 md:min-h-0 md:min-w-0",
                        "hover:border-slate-300/90 hover:bg-white hover:shadow-[0_6px_22px_rgba(15,23,42,0.16)]",
                        "active:scale-[0.96]",
                        "focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        "disabled:pointer-events-none disabled:opacity-30",
                      )}
                    >
                      <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            {/* Templates */}
            <ToolbarButton
              variant="templates"
              active={templatesOpen}
              onClick={() => {
                if (!templatesOpen) {
                  trackClientEvent(ANALYTICS_EVENTS.CHANGE_TEMPLATE_CLICKED, {
                    surface: "project_build_mobile_preview",
                  });
                }
                setTemplatesOpen((open) => {
                  const next = !open;
                  if (!next) setTemplateHoverSlug(null);
                  return next;
                });
                setFontOpen(false);
                setSizeOpen(false);
                setSpacingOpen(false);
                setColorOpen(false);
              }}
              ariaLabel="Pick a template"
            >
              <LayoutGrid className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">
                <span className="text-muted-foreground">Template: </span>
                {templateName}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-slate-700">
                Change
              </span>
              {templatesOpen ? (
                <ChevronUp className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              )}
            </ToolbarButton>

            <div className="flex items-center justify-between gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setAdvancedStyleOpen((open) => !open)}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                aria-expanded={advancedStyleOpen}
              >
                Advanced style options
              </button>
              <span className="text-[0.68rem] text-muted-foreground">{previewZoom}%</span>
            </div>

            {advancedStyleOpen ? (
              <p className="text-pretty rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground lg:hidden">
                For the safest professional result, we recommend keeping the default template style.
              </p>
            ) : null}

            <div className={cn("items-center gap-1", advancedStyleOpen ? "flex" : "hidden lg:flex")}>
              {/* Font family */}
              <ToolbarButton
                active={fontOpen}
                onClick={() => {
                  setFontOpen((v) => !v);
                  setSizeOpen(false);
                  setSpacingOpen(false);
                  setColorOpen(false);
                  setTemplatesOpen(false);
                  setTemplateHoverSlug(null);
                }}
                ariaLabel="Change font family"
              >
                <span className="font-semibold">Aa</span>
                <span className="hidden sm:inline">{currentFont.label}</span>
                <ChevronUp className={cn("size-3.5 transition-transform", fontOpen && "rotate-180")} aria-hidden />
              </ToolbarButton>

              {/* Size */}
              <ToolbarButton
                active={sizeOpen}
                onClick={() => {
                  setSizeOpen((v) => !v);
                  setFontOpen(false);
                  setSpacingOpen(false);
                  setColorOpen(false);
                  setTemplatesOpen(false);
                  setTemplateHoverSlug(null);
                }}
                ariaLabel="Change text size"
              >
                <span className="text-[0.65rem] font-semibold uppercase">t</span>
                <span className="text-sm font-semibold">T</span>
                <span className="min-w-4 tabular-nums">{currentSize.id}</span>
              </ToolbarButton>

              {/* Spacing */}
              <ToolbarButton
                active={spacingOpen}
                onClick={() => {
                  setSpacingOpen((v) => !v);
                  setFontOpen(false);
                  setSizeOpen(false);
                  setColorOpen(false);
                  setTemplatesOpen(false);
                  setTemplateHoverSlug(null);
                }}
                ariaLabel="Change spacing"
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="h-[2px] w-3 rounded bg-current" />
                  <span className="my-0.5 h-[2px] w-3 rounded bg-current" />
                  <span className="h-[2px] w-3 rounded bg-current" />
                </span>
                <span className="min-w-6 tabular-nums">
                  {currentSpacing.scale.toFixed(2)}
                </span>
              </ToolbarButton>

              {/* Accent color */}
              <ToolbarButton
                active={colorOpen}
                onClick={() => {
                  setColorOpen((v) => !v);
                  setFontOpen(false);
                  setSizeOpen(false);
                  setSpacingOpen(false);
                  setTemplatesOpen(false);
                  setTemplateHoverSlug(null);
                }}
                ariaLabel="Change accent color"
              >
                <span
                  className="inline-block size-4 rounded-full border border-black/10"
                  style={{ backgroundColor: currentColor }}
                  aria-hidden
                />
                <ChevronUp className={cn("size-3.5 transition-transform", colorOpen && "rotate-180")} aria-hidden />
              </ToolbarButton>

              {/* Focus mode */}
              <button
                type="button"
                onClick={() => setFocusMode((v) => !v)}
                className="inline-flex size-11 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:size-9"
                aria-label={focusMode ? "Exit focus mode" : "Focus preview"}
                aria-pressed={focusMode}
              >
                {focusMode ? (
                  <Minimize2 className="size-4" aria-hidden />
                ) : (
                  <Maximize2 className="size-4" aria-hidden />
                )}
              </button>
            </div>
            </div>
          </div>

          {/* Popovers */}
          {fontOpen ? (
            <Popover title="Font family" onClose={() => setFontOpen(false)} align="end">
              <div className="flex flex-col gap-1 p-1">
                {FONT_PRESETS.map((f) => {
                  const selected = currentFont.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onResumeStyleChange((s) => ({ ...s, fontFamily: f.id }));
                        setFontOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50",
                        selected && "bg-brand-muted text-brand",
                      )}
                    >
                      <span>
                        <span className="block font-semibold">{f.label}</span>
                        <span className="block text-xs text-muted-foreground">{f.hint}</span>
                      </span>
                      {selected ? <Check className="size-4 text-brand" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </Popover>
          ) : null}

          {sizeOpen ? (
            <Popover title="Text size" onClose={() => setSizeOpen(false)} align="end">
              <div className="flex flex-col gap-1 p-1">
                {SIZE_PRESETS.map((size) => {
                  const selected = currentSize.id === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => {
                        onResumeStyleChange((s) => ({ ...s, lineHeight: size.lineHeight }));
                        setSizeOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50",
                        selected && "bg-brand-muted text-brand",
                      )}
                    >
                      <span className="font-semibold">{size.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Line {size.lineHeight.toFixed(2)}
                      </span>
                      {selected ? <Check className="ml-1 size-4 text-brand" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </Popover>
          ) : null}

          {spacingOpen ? (
            <Popover title="Spacing" onClose={() => setSpacingOpen(false)} align="end">
              <div className="flex flex-col gap-1 p-1">
                {SPACING_PRESETS.map((p) => {
                  const selected = currentSpacing.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onResumeStyleChange((s) => ({
                          ...s,
                          sectionGapScale: p.scale,
                          paragraphGapScale: p.scale,
                        }));
                        setSpacingOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50",
                        selected && "bg-brand-muted text-brand",
                      )}
                    >
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Scale {p.scale.toFixed(2)}
                      </span>
                      {selected ? <Check className="ml-1 size-4 text-brand" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </Popover>
          ) : null}

          {colorOpen ? (
            <Popover title="Accent color" onClose={() => setColorOpen(false)} align="end">
              <div className="grid grid-cols-5 gap-2 p-1.5">
                {COLOR_SWATCHES.map((hex) => {
                  const selected = hex.toLowerCase() === (currentColor ?? "").toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        onResumeStyleChange((s) => ({ ...s, accent: hex, accentStrong: hex }));
                        setColorOpen(false);
                      }}
                      aria-label={`Accent ${hex}`}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full ring-2 ring-transparent transition-all",
                        selected ? "ring-offset-2 ring-brand" : "hover:scale-105",
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {selected ? <Check className="size-4 text-white" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2 text-xs">
                <label htmlFor="accent-custom" className="text-muted-foreground">
                  Custom
                </label>
                <input
                  id="accent-custom"
                  type="color"
                  value={currentColor}
                  onChange={(e) =>
                    onResumeStyleChange((s) => ({
                      ...s,
                      accent: e.target.value,
                      accentStrong: e.target.value,
                    }))
                  }
                  className="h-7 w-10 cursor-pointer rounded border border-border/70 bg-transparent"
                  aria-label="Pick custom color"
                />
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() =>
                    onResumeStyleChange((s) => ({ ...s, accent: null, accentStrong: null }))
                  }
                >
                  Use template default
                </button>
              </div>
            </Popover>
          ) : null}

          <div className="mx-auto mt-1 flex max-w-[780px] items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <span className="truncate">
              Template: <span className="font-semibold text-foreground">{templateName}</span>
            </span>
          </div>
      </div>
        </>
      )}
      mobileFab={mobilePreviewOpen || mobilePreviewActionVisible || mobileDownloadActionVisible ? (
        <StickyBottomBar
          className="border-slate-200/90 bg-white/95 shadow-[0_-10px_40px_-12px_rgba(15,23,42,0.18)] lg:hidden"
          innerClassName="max-w-none px-3 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] pt-2"
          role="navigation"
          aria-label="Resume editor mobile actions"
        >
          {mobilePreviewOpen ? (
            <div className="mx-auto w-full max-w-lg space-y-2">
              <p className="text-center text-xs font-medium text-muted-foreground">
                {projectCanDownload
                  ? "PDF export unlocked"
                  : resumeReadiness.isExportReady
                    ? "Preview free · Pay once to download your PDF"
                    : "Finish the key sections before downloading a final PDF"}
              </p>
              <div className="flex items-stretch gap-2">
                <Button
                  type="button"
                  variant={mobileDownloadActionVisible ? "outline" : "default"}
                  size="touch"
                  className={cn(
                    "min-w-0 gap-2",
                    mobileDownloadActionVisible
                      ? "flex-1 bg-white"
                      : "flex-1 bg-slate-900 text-white hover:bg-slate-800",
                  )}
                  onClick={() => setMobilePreviewOpen(false)}
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  {mobileDownloadActionVisible ? "Edit" : "Continue editing"}
                </Button>
                {!mobileDownloadActionVisible && showAiScoreCard ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="touch"
                    className="min-w-0 flex-1 bg-white"
                    onClick={handleImproveWithAiFromPreview}
                  >
                    Improve with AI
                  </Button>
                ) : null}
                {mobileDownloadActionVisible && onProjectPreviewClick ? (
                <Button
                  type="button"
                  size="touch"
                  disabled={projectPreviewPending}
                  className="min-w-0 flex-1 whitespace-normal bg-[#2268d7] text-center text-white hover:bg-[#1f5fca]"
                  onClick={onProjectPreviewClick}
                >
                  {projectPreviewPending ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <Download className="size-4 shrink-0" aria-hidden />
                  )}
                  <span className="leading-tight">
                    {projectPreviewPending
                      ? (projectPreviewPendingText ?? "Preparing PDF...")
                      : "Download resume"}
                  </span>
                </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto flex w-full max-w-lg items-stretch gap-2">
                {persistMode !== "project" && firstResumeSoftIssue ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="touch"
                    className="shrink-0 px-4"
                    onClick={() => scrollStudioSectionIntoView(firstResumeSoftIssue.section)}
                  >
                    Fix next
                  </Button>
                ) : null}
                {mobilePreviewActionVisible ? (
                  <Button
                    type="button"
                    variant={mobileDownloadActionVisible ? "outline" : "default"}
                    size="touch"
                    className={cn(
                      "min-w-0 flex-1 gap-2",
                      mobileDownloadActionVisible
                        ? "bg-white"
                        : "bg-[#2268d7] text-white hover:bg-[#1f5fca]",
                    )}
                    onClick={() => {
                      trackClientEvent(
                        persistMode === "project"
                          ? ANALYTICS_EVENTS.MOBILE_PREVIEW_CLICKED
                          : ANALYTICS_EVENTS.PREVIEW_RESUME_CLICKED,
                        {
                          surface:
                            persistMode === "project" ? "project_build_mobile" : "guest_create_mobile",
                        },
                      );
                      setMobilePreviewOpen(true);
                    }}
                  >
                    <SquareSplitHorizontal className="size-4 shrink-0" aria-hidden />
                    Preview resume
                  </Button>
                ) : null}
                {mobileDownloadActionVisible && onProjectPreviewClick ? (
                  <Button
                    type="button"
                    size="touch"
                    disabled={projectPreviewPending}
                    className="min-w-0 flex-1 whitespace-normal bg-[#2268d7] text-center text-white hover:bg-[#1f5fca]"
                    onClick={onProjectPreviewClick}
                  >
                    {projectPreviewPending ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Download className="size-4 shrink-0" aria-hidden />
                    )}
                    <span className="leading-tight">
                      {projectPreviewPending
                        ? (projectPreviewPendingText ?? "Preparing PDF...")
                        : "Download resume"}
                    </span>
                  </Button>
                ) : null}
              </div>
              {persistMode !== "project" && firstResumeSoftIssue && !mobilePreviewOpen ? (
                <p className="mx-auto mt-2 max-w-lg text-pretty text-center text-xs leading-snug text-muted-foreground">
                  {firstResumeSoftIssue.message}
                </p>
              ) : persistMode !== "project" && !previewableContent ? (
                <p className="mx-auto mt-2 max-w-lg text-pretty text-center text-xs leading-snug text-muted-foreground">
                  Add a name, profile, or work history — then open a full-page preview here.
                </p>
              ) : null}
            </>
          )}
        </StickyBottomBar>
      ) : null}
    />
  );
}

/* -------------------------- Small building blocks ------------------------- */

function Popover({
  title,
  onClose,
  align = "start",
  children,
}: {
  title: string;
  onClose: () => void;
  align?: "start" | "end";
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        "absolute bottom-[calc(100%+0.5rem)] z-40 w-[min(100%,22rem)] rounded-xl border border-border/70 bg-white p-1.5 shadow-xl ring-1 ring-black/5",
        align === "start" ? "left-2" : "right-2",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>
      {children}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
  ariaLabel,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel: string;
  variant?: "default" | "templates";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:h-9 md:min-h-0 md:px-2.5 md:text-xs",
        variant === "templates"
          ? "rounded-full border"
          : "rounded-md",
        variant === "templates"
          ? active
            ? "border-[#2268d7] bg-[#2268d7]/10 text-slate-900 shadow-sm"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          : active
            ? "bg-slate-900/5 text-slate-900"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function ModulePill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex max-w-full min-h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-left text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 md:min-h-9 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
    >
      <Plus className="size-4 shrink-0 text-neutral-500 md:size-3.5" aria-hidden />
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function SaveBadge({
  status,
  error,
  onRetry,
  isDirty = false,
}: {
  status: SaveStatus;
  error: string | null;
  onRetry: () => void;
  isDirty?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1";
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(base, "bg-destructive/12 text-destructive ring-destructive/25")}
      >
        {error ?? "Save failed — tap to retry"}
      </button>
    );
  }
  if (status === "saving") {
    return (
      <div className={cn(base, "bg-muted/50 text-muted-foreground ring-border")}>
        Saving locally…
      </div>
    );
  }
  if (isDirty) {
    return (
      <div className={cn(base, "bg-amber-50 text-amber-950 ring-amber-200/80")}>
        Unsaved changes
        {status === "saved" ? <span className="font-normal opacity-80"> — saving soon</span> : null}
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className={cn(base, "bg-success/12 text-success ring-success/25")}>
        <Check className="size-3" aria-hidden />
        Saved on this device
      </div>
    );
  }
  return (
    <div className={cn(base, "bg-brand-muted text-brand ring-brand/15")}>Local draft</div>
  );
}

function MobileModeSwitch({
  active,
  previewEnabled,
  onBuild,
  onPreview,
}: {
  active: "build" | "preview";
  previewEnabled: boolean;
  onBuild: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-sm lg:hidden">
      <button
        type="button"
        onClick={onBuild}
        aria-pressed={active === "build"}
        className={cn(
          "min-h-10 rounded-full px-3 text-sm font-semibold transition-colors",
          active === "build"
            ? "bg-white text-slate-950 shadow-sm"
            : "text-slate-600 hover:text-slate-950",
        )}
      >
        Build
      </button>
      <button
        type="button"
        onClick={onPreview}
        disabled={!previewEnabled}
        aria-pressed={active === "preview"}
        className={cn(
          "min-h-10 rounded-full px-3 text-sm font-semibold transition-colors",
          active === "preview"
            ? "bg-white text-slate-950 shadow-sm"
            : "text-slate-600 hover:text-slate-950",
          !previewEnabled && "cursor-not-allowed opacity-45 hover:text-slate-600",
        )}
      >
        Preview
      </button>
    </div>
  );
}

function SectionOverflowMenu({
  section,
  onBeginRename,
  pageBreak,
  onPageBreakChange,
  showNameIn,
  onShowNameInChange,
  canRemovePhoto,
  onRemovePhoto,
}: {
  section: SectionDef;
  onBeginRename: () => void;
  pageBreak: boolean;
  onPageBreakChange: (next: boolean) => void;
  showNameIn: WizardStateV1["personal"]["showNameIn"];
  onShowNameInChange: (v: WizardStateV1["personal"]["showNameIn"]) => void;
  canRemovePhoto: boolean;
  onRemovePhoto: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        data-no-section-drag
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#2268d7]/35"
        aria-label={`${section.label} section options`}
      >
        <MoreVertical className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-neutral-200 bg-white p-0 py-2 shadow-lg ring-1 ring-black/[0.06]"
      >
        <div className="px-1.5">
          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2.5 text-[0.9375rem] focus:bg-neutral-100/90"
            onClick={(e) => {
              e.stopPropagation();
              onBeginRename();
            }}
          >
            <Tag className="size-4 shrink-0 text-neutral-500" aria-hidden />
            Rename section
          </DropdownMenuItem>
          {section.id === "personal" ? (
            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2.5 text-[0.9375rem] focus:bg-neutral-100/90"
              disabled={!canRemovePhoto}
              onClick={(e) => {
                e.stopPropagation();
                if (canRemovePhoto) onRemovePhoto();
              }}
            >
              <Camera className="size-4 shrink-0 text-neutral-500" aria-hidden />
              Remove photo
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuCheckboxItem
            checked={pageBreak}
            onCheckedChange={(v) => onPageBreakChange(Boolean(v))}
            className="cursor-pointer gap-2.5 rounded-md py-2.5 pr-8 pl-2.5 text-[0.9375rem] data-[checked=true]:bg-transparent focus:bg-neutral-100/90"
          >
            <SquareSplitHorizontal className="size-4 shrink-0 text-neutral-500" aria-hidden />
            Add page break
          </DropdownMenuCheckboxItem>
        </div>

        {section.id === "personal" ? (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-neutral-200/90" />
            {/* Base UI: GroupLabel must live inside Menu.Group or it throws at runtime. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 pt-1 pb-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-400">
                Show name in
              </DropdownMenuLabel>
              <div className="px-1.5 pb-0.5">
                {(
                  [
                    { value: "title" as const, label: "Title" },
                    { value: "personal" as const, label: "Personal details" },
                    { value: "both" as const, label: "Both" },
                  ] as const
                ).map((row) => (
                  <DropdownMenuItem
                    key={row.value}
                    className="cursor-pointer gap-2 rounded-md py-2.5 pr-2 pl-2 text-[0.9375rem] focus:bg-neutral-100/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowNameInChange(row.value);
                    }}
                  >
                    <span className="inline-flex size-4 shrink-0 justify-center">
                      {showNameIn === row.value ? (
                        <Check className="size-4 text-neutral-800" aria-hidden />
                      ) : null}
                    </span>
                    {row.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Whether a list reorder drag may start for this pointer gesture.
 * `pointerIntent` is the element that received pointerdown (deepest hit).
 * `dragSourceElement` is the draggable that fired dragstart — used only as a fallback when
 * intent is missing (should be rare).
 */
function sectionRowDragAllowed(
  pointerIntent: Element | null,
  dragSourceElement: Element | null,
): boolean {
  const t = pointerIntent ?? dragSourceElement;
  if (!(t instanceof Element)) return true;
  if (t.closest("[data-no-section-drag]")) return false;
  if (t.closest("[data-section-drag-handle], [data-section-drag-rail]")) {
    if (t.closest("input,textarea,select,a,[contenteditable='true'],label")) return false;
    if (
      t.closest("button") &&
      !t.closest("[data-section-title-drag]") &&
      !t.closest("[data-section-expand-toggle]")
    ) {
      return false;
    }
    return true;
  }
  if (t.closest("input,textarea,select,button,a,[contenteditable='true'],label")) {
    return false;
  }
  return true;
}

function IntakeShortcuts({
  onOpenSelectExampleTemplate,
  resumeUpload,
  onLinkedInImport,
}: {
  onOpenSelectExampleTemplate: () => void;
  resumeUpload: ReactNode;
  onLinkedInImport: () => void;
}) {
  const cardBase =
    "flex min-h-[7.75rem] w-full flex-col items-center justify-center gap-3 rounded-xl border px-4 py-4 text-center outline-none transition-[border-color,box-shadow,transform] duration-200 sm:min-h-[8.25rem] sm:gap-3.5 sm:py-5";

  return (
    <section
      className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-white p-4 shadow-sm ring-1 ring-slate-950/[0.03] sm:p-5"
      aria-labelledby="guest-intake-heading"
    >
      <div className="mb-3.5 sm:mb-4">
        <h2
          id="guest-intake-heading"
          className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
        >
          Choose a starting point
        </h2>
        <p className="mt-1 max-w-prose text-xs leading-snug text-slate-500 sm:text-[0.8125rem]">
          Three ways to begin — switch or combine approaches anytime while you edit.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
        <button
          type="button"
          onClick={onOpenSelectExampleTemplate}
          className={cn(
            cardBase,
            "group border-slate-200/90 bg-white shadow-sm",
            "hover:border-emerald-300/80 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2",
            "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
          )}
        >
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-900/[0.06] transition-colors sm:size-[3.25rem]",
              "group-hover:bg-emerald-100/95 group-hover:text-emerald-800",
            )}
            aria-hidden
          >
            <BookOpenCheck className="size-6 sm:size-[1.65rem]" strokeWidth={1.75} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-tight text-slate-900">Start from example</span>
            <span className="text-pretty text-xs font-medium leading-snug text-slate-500">
              Pick a template — we&apos;ll load a demo résumé you can edit right away
            </span>
          </span>
        </button>

        {resumeUpload}

        <button
          type="button"
          onClick={onLinkedInImport}
          className={cn(
            cardBase,
            "group border-slate-200/90 bg-white shadow-sm",
            "hover:border-[#0a66c2]/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2",
            "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
          )}
        >
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0a66c2]/10 ring-1 ring-[#0a66c2]/15 transition-colors sm:size-[3.25rem]",
              "group-hover:bg-[#0a66c2]/14",
            )}
            aria-hidden
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#0a66c2] text-[0.68rem] font-bold leading-none text-white shadow-sm">
              in
            </span>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-tight text-slate-900">Import LinkedIn profile</span>
            <span className="text-pretty text-xs font-medium leading-snug text-slate-500">
              Opens Personal details with LinkedIn — paste your profile URL
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}

function GuestStartMethodCards({
  onStartFromScratch,
  onOpenSelectExampleTemplate,
  resumeUpload,
}: {
  onStartFromScratch: () => void;
  onOpenSelectExampleTemplate: () => void;
  resumeUpload: ReactNode;
}) {
  const cardBase =
    "group flex min-h-[5.75rem] w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3 py-3 text-left shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-[#2268d7]/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] motion-reduce:active:scale-100 min-[380px]:min-h-[6.25rem] min-[380px]:px-4 min-[380px]:py-4";

  return (
    <section
      className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm ring-1 ring-slate-950/[0.03] min-[380px]:p-4 sm:p-5"
      aria-labelledby="guest-start-method-heading"
    >
      <div>
        <h2 id="guest-start-method-heading" className="text-xl font-semibold tracking-tight text-slate-950">
          How would you like to start?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Choose the fastest way to begin. You can edit everything later.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <button type="button" onClick={onStartFromScratch} className={cardBase}>
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2268d7]/10 text-[#2268d7] ring-1 ring-[#2268d7]/10"
            aria-hidden
          >
            <Plus className="size-6" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-slate-950">Start from scratch</span>
              <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-brand">
                Recommended
              </span>
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-slate-600">
              Build your resume step by step with AI help.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>

        <button type="button" onClick={onOpenSelectExampleTemplate} className={cardBase}>
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-900/[0.06]"
            aria-hidden
          >
            <BookOpenCheck className="size-6" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-base font-semibold tracking-tight text-slate-950">Start with an example</span>
            <span className="mt-1 block text-sm leading-relaxed text-slate-600">
              Choose a professional layout with sample content, then replace it with your own.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>

        {resumeUpload}

        <button
          type="button"
          disabled
            className="flex min-h-[5.75rem] w-full cursor-not-allowed items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-left opacity-80 min-[380px]:min-h-[6.25rem] min-[380px]:px-4 min-[380px]:py-4"
        >
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200/70 text-slate-500"
            aria-hidden
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-500 text-[0.65rem] font-bold leading-none text-white">
              in
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-slate-700">Import LinkedIn profile</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Coming soon
              </span>
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-slate-500">
              LinkedIn import is not available yet.
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}

function SectionCard({
  section,
  displayLabel,
  onNativeSectionDragStart,
  onNativeSectionDragEnd,
  open,
  onToggle,
  completion,
  titleEditing,
  titleDraft,
  onTitleDraftChange,
  onTitleCommit,
  onTitleCancel,
  headerMenu,
  isSectionDragSource = false,
  isSectionDropTarget = false,
  isSectionDragContext = false,
  sectionReorder,
  children,
}: {
  section: SectionDef;
  displayLabel: string;
  /** Same handlers as the outer list row — also on rail, title, expand, and handle shells so HTML5 drag can start from most of the card. */
  onNativeSectionDragStart: (e: DragEvent<HTMLElement>) => void;
  onNativeSectionDragEnd: () => void;
  open: boolean;
  onToggle: () => void;
  completion: SectionCompletion;
  titleEditing: boolean;
  titleDraft: string;
  onTitleDraftChange: (value: string) => void;
  onTitleCommit: () => void;
  onTitleCancel: () => void;
  headerMenu: ReactNode;
  isSectionDragSource?: boolean;
  isSectionDropTarget?: boolean;
  isSectionDragContext?: boolean;
  sectionReorder?: {
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
  };
  children: ReactNode;
}) {
  const skipBlurCommitRef = useRef(false);

  return (
    <section
      className={cn(
        "grid min-h-0 grid-cols-[2.5rem_minmax(0,1fr)] items-stretch motion-safe:transition-[background-color,opacity] motion-safe:duration-200",
        /* Collapsed rows stay tall enough for a reliable drag target (rail + header). */
        !open && "min-h-[2.75rem]",
        open && !isSectionDragSource && "bg-neutral-50/60",
        isSectionDragContext && "bg-white",
        isSectionDropTarget && !isSectionDragSource && "bg-emerald-50/50",
        isSectionDragSource && "opacity-[0.97]",
      )}
    >
      {/* Full-height rail — every section (any list position) has a reliable drag surface. */}
      <div
        data-section-drag-rail
        draggable
        onDragStart={onNativeSectionDragStart}
        onDragEnd={onNativeSectionDragEnd}
        className={cn(
          "flex w-full min-h-[2.75rem] cursor-grab flex-col items-center justify-center border-r border-slate-200/80 bg-slate-100/80 py-2 active:cursor-grabbing sm:min-h-0 sm:justify-start sm:py-2.5",
          /* touch-none while open avoids scroll fighting the rail; collapsed keeps touch scrolling on long lists. */
          open && "touch-none",
          isSectionDragSource &&
            "cursor-grabbing border-[#2d9f6d]/50 bg-[#2d9f6d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          isSectionDropTarget && !isSectionDragSource && "border-emerald-300/80 bg-emerald-100/90",
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <GripVertical
            className={cn(
              "size-4 shrink-0",
              isSectionDragSource ? "text-white" : "text-slate-500",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col">
        <div
          data-section-drag-handle
          draggable
          onDragStart={onNativeSectionDragStart}
          onDragEnd={onNativeSectionDragEnd}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-[1.05rem] selection:bg-transparent sm:px-4 sm:py-[1.1rem]",
            isSectionDragSource &&
              "bg-[#2d9f6d] py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
            isSectionDropTarget &&
              !isSectionDragSource &&
              "bg-emerald-50/90 py-[1.05rem] ring-1 ring-[#2d9f6d]/25 sm:py-[1.1rem]",
          )}
        >
        {sectionReorder ? (
          <div
            className="flex shrink-0 flex-col gap-px"
            role="group"
            aria-label={`Reorder ${displayLabel}`}
          >
            <Button
              type="button"
              data-no-section-drag
              variant="ghost"
              size="icon"
              draggable={false}
              disabled={!sectionReorder.canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                sectionReorder.onMoveUp();
              }}
              className="size-10 min-h-[var(--touch-target-min)] shrink-0 cursor-pointer text-neutral-500 hover:text-neutral-800 disabled:opacity-30 md:size-7 md:min-h-0"
              aria-label={`Move ${displayLabel} up in the list`}
            >
              <ChevronUp className="size-4 md:size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              data-no-section-drag
              variant="ghost"
              size="icon"
              draggable={false}
              disabled={!sectionReorder.canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                sectionReorder.onMoveDown();
              }}
              className="size-10 min-h-[var(--touch-target-min)] shrink-0 cursor-pointer text-neutral-500 hover:text-neutral-800 disabled:opacity-30 md:size-7 md:min-h-0"
              aria-label={`Move ${displayLabel} down in the list`}
            >
              <ChevronDown className="size-4 md:size-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}
        {titleEditing ? (
          <div
            data-no-section-drag
            className="min-w-0 flex-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Input
              autoFocus
              value={titleDraft}
              onChange={(e) => onTitleDraftChange(e.target.value)}
              onBlur={() => {
                if (skipBlurCommitRef.current) {
                  skipBlurCommitRef.current = false;
                  return;
                }
                onTitleCommit();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onTitleCommit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  skipBlurCommitRef.current = true;
                  onTitleCancel();
                }
              }}
              aria-label="Section title"
              className={cn(
                softInput,
                "h-9 rounded-lg px-3 text-[0.95rem] font-semibold tracking-tight ring-1 ring-[#2268d7]/35",
              )}
            />
          </div>
        ) : (
          <button
            type="button"
            data-section-title-drag
            draggable
            onDragStart={onNativeSectionDragStart}
            onDragEnd={onNativeSectionDragEnd}
            onClick={onToggle}
            aria-expanded={open}
            className={cn(
              "min-w-0 flex-1 cursor-pointer truncate text-[0.95rem] font-semibold tracking-tight transition-colors",
              isSectionDragSource || isSectionDropTarget
                ? "text-center"
                : "text-left",
              isSectionDropTarget &&
                !isSectionDragSource &&
                "rounded-lg ring-1 ring-[#2d9f6d]/35 ring-offset-1 ring-offset-transparent",
            )}
          >
            <span className="inline-flex min-w-0 max-w-full items-center gap-2.5">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full ring-1 ring-black/[0.06]",
                  completion === "complete" && "bg-emerald-500",
                  completion === "started" && "bg-amber-400",
                  completion === "empty" && "bg-neutral-300",
                )}
                title={
                  completion === "complete"
                    ? "Section looks strong"
                    : completion === "started"
                      ? "In progress"
                      : "Not started"
                }
                aria-hidden
              />
              <span
                className={cn(
                  "min-w-0 truncate",
                  !isSectionDragSource && open && "text-[#2268d7]",
                  !isSectionDragSource && !open && "text-neutral-500",
                  !isSectionDragSource && completion !== "empty" && !open && "text-neutral-600",
                  isSectionDragSource && "text-base font-bold tracking-tight text-white",
                  isSectionDropTarget && !isSectionDragSource && "font-bold text-emerald-900",
                  isSectionDragContext && "text-neutral-600",
                )}
              >
                {displayLabel}
              </span>
              {section.optional && !isSectionDragSource && !isSectionDropTarget ? (
                <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-neutral-400">
                  Optional
                </span>
              ) : null}
            </span>
          </button>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {open ? headerMenu : null}
          <button
            type="button"
            data-section-expand-toggle
            draggable
            onDragStart={onNativeSectionDragStart}
            onDragEnd={onNativeSectionDragEnd}
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Collapse section" : "Expand section"}
            className={cn(
              "inline-flex size-10 shrink-0 cursor-grab items-center justify-center rounded-full border-2 transition-colors active:cursor-grabbing md:size-8",
              isSectionDragSource &&
                "border-white/80 bg-white/10 text-white hover:bg-white/20",
              !isSectionDragSource &&
                open &&
                "border-[#2268d7] bg-[#2268d7]/8 text-[#2268d7]",
              !isSectionDragSource &&
                !open &&
                completion !== "empty" &&
                "border-neutral-300 text-neutral-500",
              !isSectionDragSource &&
                !open &&
                completion === "empty" &&
                "border-neutral-300 text-neutral-400",
              !isSectionDragSource &&
                !open &&
                completion === "complete" &&
                "border-emerald-400/80 text-emerald-700",
            )}
          >
            {open ? (
              <ChevronUp className="size-[0.95rem] stroke-[2.25]" aria-hidden />
            ) : (
              <Plus className="size-[0.9rem] stroke-[2.5]" aria-hidden />
            )}
          </button>
        </div>
      </div>
        {open ? (
          <div
            data-section-drag-handle
            draggable
            onDragStart={onNativeSectionDragStart}
            onDragEnd={onNativeSectionDragEnd}
            className={cn(
              "min-h-0 border-t px-4 pb-5 pt-4 sm:px-5",
              isSectionDragSource
                ? "border-white/20 bg-white"
                : "border-neutral-200/90 bg-white",
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** True when every entry's tracked fields exactly match the demo's — i.e. still untouched sample data. */
function entryListMatchesExample<T extends Record<string, unknown>>(
  entries: readonly T[],
  demoEntries: readonly T[],
  fields: readonly (keyof T)[],
): boolean {
  if (entries.length === 0 || entries.length !== demoEntries.length) return false;
  return entries.every((entry, i) =>
    fields.every((field) => entry[field] === demoEntries[i]![field]),
  );
}

/** Small notice for fields still holding untouched "Start with an example" sample content. */
function ExampleContentNotice({ what }: { what: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-300/90 bg-amber-50/70 px-4 py-3 sm:px-5">
      <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-950">
        Example
      </span>
      <p className="text-pretty text-sm leading-relaxed text-amber-950/80">
        {`Sample ${what} from the template. Edit this section with your own details, or remove it if it doesn't apply to you.`}
      </p>
    </div>
  );
}

function isSectionFilled(id: SectionId, s: WizardStateV1): boolean {
  switch (id) {
    case "personal": {
      const n = [
        s.personal.givenName,
        s.personal.middleName,
        s.personal.familyName,
        s.personal.fullName,
      ]
        .map((x) => x.trim())
        .join("")
        .length;
      return Boolean(n || s.personal.email.trim());
    }
    case "summary":
      return Boolean(
        s.summary.headline.trim() || !isProfileDescriptionEmpty(s.summary.summary),
      );
    case "experience":
      return s.experience.entries.some((e) => e.title.trim() || e.company.trim());
    case "education":
      return s.education.entries.some((e) => e.school.trim() || e.degree.trim());
    case "skills":
      return s.skills.lines.trim().length > 0;
    case "languages":
      return s.languages.lines.trim().length > 0;
    case "hobbies":
      return s.hobbies.lines.trim().length > 0;
    case "courses":
      return s.courses.lines.trim().length > 0;
    case "internships":
      return s.internships.lines.trim().length > 0;
    case "projects":
      return s.projects.entries.some((p) => p.name.trim());
    case "certifications":
      return s.certifications.entries.some((c) => c.name.trim());
    case "additional":
      return s.additional.notes.trim().length > 0;
    default:
      return false;
  }
}

type SectionCompletion = "empty" | "started" | "complete";

function hasDisplayName(s: WizardStateV1): boolean {
  if (s.personal.fullName.trim()) return true;
  return Boolean(s.personal.givenName.trim() || s.personal.familyName.trim());
}

function hasReasonableEmail(s: WizardStateV1): boolean {
  const e = s.personal.email.trim();
  return e.includes("@") && e.length >= 5;
}

function lineBlockDepth(lines: string): number {
  return lines
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;
}

function getSectionCompletion(id: SectionId, s: WizardStateV1): SectionCompletion {
  if (!isSectionFilled(id, s)) return "empty";
  switch (id) {
    case "personal":
      return hasDisplayName(s) && hasReasonableEmail(s) ? "complete" : "started";
    case "summary":
      return Boolean(
        s.summary.headline.trim() && !isProfileDescriptionEmpty(s.summary.summary),
      )
        ? "complete"
        : "started";
    case "experience": {
      const strong = s.experience.entries.some(
        (e) =>
          e.title.trim() &&
          e.company.trim() &&
          (e.startDate.trim() || e.current) &&
          e.highlights.some((h) => h.trim().length > 12),
      );
      return strong ? "complete" : "started";
    }
    case "education": {
      const strong = s.education.entries.some(
        (e) => e.school.trim() && e.degree.trim() && (e.startDate.trim() || e.endDate.trim()),
      );
      return strong ? "complete" : "started";
    }
    case "skills":
      return lineBlockDepth(s.skills.lines) >= 2 ? "complete" : "started";
    case "languages":
    case "hobbies":
    case "courses":
    case "internships": {
      const lines =
        id === "languages"
          ? s.languages.lines
          : id === "hobbies"
            ? s.hobbies.lines
            : id === "courses"
              ? s.courses.lines
              : s.internships.lines;
      return lineBlockDepth(lines) >= 2 ? "complete" : "started";
    }
    case "projects": {
      const strong = s.projects.entries.some(
        (p) => p.name.trim() && p.description.trim().length > 24,
      );
      return strong ? "complete" : "started";
    }
    case "certifications": {
      const strong = s.certifications.entries.some(
        (c) => c.name.trim() && c.issuer.trim(),
      );
      return strong ? "complete" : "started";
    }
    case "additional":
      return s.additional.notes.trim().length > 80 ? "complete" : "started";
    default:
      return "started";
  }
}

type ResumeSoftIssue = { section: SectionId; message: string };

/** Friendly checks — not blocking save; used for guidance + scroll targets. */
function getFirstResumeSoftIssue(s: WizardStateV1): ResumeSoftIssue | null {
  if (!hasDisplayName(s)) {
    return {
      section: "personal",
      message: "Add your name so it appears correctly on the resume and in emails.",
    };
  }
  if (!hasReasonableEmail(s)) {
    return {
      section: "personal",
      message: "Add a working email — it is the main way people reach you back.",
    };
  }
  return null;
}

/* ------------------------------ Section bodies ---------------------------- */

function SectionBody({
  section,
  state,
  setState,
  loginHref,
  jobAssist,
  aiAssistProjectId,
  personalPillOpenRequest = null,
  exampleContentFlags,
}: {
  section: SectionId;
  state: WizardStateV1;
  setState: Dispatch<SetStateAction<WizardStateV1>>;
  loginHref: string;
  jobAssist?: StudioJobAssistProps;
  aiAssistProjectId: string;
  personalPillOpenRequest?: { id: number; keys: PersonalPillKey[] } | null;
  exampleContentFlags: {
    languages: boolean;
    hobbies: boolean;
    certifications: boolean;
    projects: boolean;
  };
}) {
  switch (section) {
    case "personal":
      return (
        <PersonalBody
          state={state}
          setState={setState}
          pillOpenRequest={personalPillOpenRequest}
        />
      );
    case "summary":
      return (
        <SummaryBody
          state={state}
          setState={setState}
          loginHref={loginHref}
          jobAssist={jobAssist}
          aiAssistProjectId={aiAssistProjectId}
        />
      );
    case "experience":
      return (
        <ExperienceBody
          state={state}
          setState={setState}
          jobAssist={jobAssist}
          aiAssistProjectId={aiAssistProjectId}
        />
      );
    case "education":
      return <EducationBody state={state} setState={setState} aiAssistProjectId={aiAssistProjectId} />;
    case "skills":
      return (
        <SkillsBody
          state={state}
          setState={setState}
          jobAssist={jobAssist}
          aiAssistProjectId={aiAssistProjectId}
        />
      );
    case "languages":
      return (
        <LinesBlockBody
          id="languages"
          label="Languages"
          description="One language per line. You can add proficiency (e.g. English — native, Spanish — B2)."
          placeholder={"English — Native\nSpanish — Professional working proficiency"}
          value={state.languages.lines}
          onChange={(lines) => setState((s) => ({ ...s, languages: { lines } }))}
          isExample={exampleContentFlags.languages}
        />
      );
    case "hobbies":
      return (
        <LinesBlockBody
          id="hobbies"
          label="Hobbies"
          description="Short list of interests — keeps your CV human and memorable."
          placeholder={"Photography\nChess club\nCommunity volunteering"}
          value={state.hobbies.lines}
          onChange={(lines) => setState((s) => ({ ...s, hobbies: { lines } }))}
          isExample={exampleContentFlags.hobbies}
        />
      );
    case "courses":
      return (
        <LinesBlockBody
          id="courses"
          label="Courses"
          description="Relevant training, bootcamps, or continuing education — one per line."
          placeholder={"AWS Cloud Practitioner — 2024\nDesign Thinking — Coursera"}
          value={state.courses.lines}
          onChange={(lines) => setState((s) => ({ ...s, courses: { lines } }))}
        />
      );
    case "internships":
      return (
        <LinesBlockBody
          id="internships"
          label="Internships"
          description="Company, role, and dates — one entry per line or short paragraph."
          placeholder={"Product intern · Acme Inc. · Summer 2023"}
          value={state.internships.lines}
          onChange={(lines) => setState((s) => ({ ...s, internships: { lines } }))}
        />
      );
    case "projects":
      return (
        <ProjectsBody state={state} setState={setState} isExample={exampleContentFlags.projects} />
      );
    case "certifications":
      return (
        <CertificationsBody
          state={state}
          setState={setState}
          isExample={exampleContentFlags.certifications}
        />
      );
    case "additional":
      return <AdditionalBody state={state} setState={setState} aiAssistProjectId={aiAssistProjectId} />;
    default:
      return null;
  }
}

type Setter = Dispatch<SetStateAction<WizardStateV1>>;

function PersonalBody({
  state,
  setState,
  pillOpenRequest = null,
}: {
  state: WizardStateV1;
  setState: Setter;
  pillOpenRequest?: { id: number; keys: PersonalPillKey[] } | null;
}) {
  const p = state.personal;
  const [openPills, setOpenPills] = useState<Set<PersonalPillKey>>(() => new Set());
  const [renamingCustomFieldId, setRenamingCustomFieldId] = useState<string | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const linkedInShortcutFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      renamingCustomFieldId &&
      !p.customFields.some((c) => c.id === renamingCustomFieldId)
    ) {
      setRenamingCustomFieldId(null);
    }
  }, [p.customFields, renamingCustomFieldId]);

  useLayoutEffect(() => {
    if (!renamingCustomFieldId) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`customFieldName-${renamingCustomFieldId}`);
      if (el instanceof HTMLInputElement) {
        el.focus();
        el.select();
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [renamingCustomFieldId]);

  useEffect(() => {
    if (!pillOpenRequest?.keys.length) return;
    const keys = pillOpenRequest.keys;
    setOpenPills((prev) => {
      const n = new Set(prev);
      for (const k of keys) {
        n.add(k);
      }
      return n;
    });
  }, [pillOpenRequest?.id, pillOpenRequest]);

  useLayoutEffect(() => {
    if (!pillOpenRequest?.keys?.includes("linkedInPill")) return;
    if (!openPills.has("linkedInPill")) return;
    if (linkedInShortcutFocusRef.current === pillOpenRequest.id) return;
    linkedInShortcutFocusRef.current = pillOpenRequest.id;
    document.getElementById("li-pill")?.querySelector<HTMLInputElement>("input")?.focus();
  }, [openPills, pillOpenRequest]);

  const addOptionalPill = (key: PersonalPillKey) => {
    setOpenPills((prev) => {
      if (prev.has(key)) return prev;
      const n = new Set(prev);
      n.add(key);
      return n;
    });
  };

  const updatePersonal = (patch: Partial<WizardStateV1["personal"]>) => {
    setState((s) => {
      const next = { ...s.personal, ...patch };
      const g = next.givenName.trim();
      const m = next.middleName.trim();
      const f = next.familyName.trim();
      next.fullName = [g, m, f].filter(Boolean).join(" ").trim();
      let summary = s.summary;
      if (next.useJobPositionAsHeadline) {
        summary = { ...s.summary, headline: next.desiredJobPosition };
      }
      return { ...s, personal: next, summary };
    });
  };

  const removeOptionalPill = (key: PersonalPillKey) => {
    setOpenPills((prev) => {
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
    const clears: Partial<WizardStateV1["personal"]> =
      key === "dateOfBirth"
        ? { dateOfBirth: "" }
        : key === "placeOfBirth"
          ? { placeOfBirth: "" }
          : key === "driversLicense"
            ? { driversLicense: "" }
            : key === "gender"
              ? { gender: "" }
              : key === "nationality"
                ? { nationality: "" }
                : key === "civilStatus"
                  ? { civilStatus: "" }
                  : key === "websitePill"
                    ? { website: "" }
                    : { linkedIn: "" };
    updatePersonal(clears);
  };

  const addBlankCustomLine = () => {
    setState((s) => ({
      ...s,
      personal: {
        ...s.personal,
        customFields: [
          ...s.personal.customFields,
          { id: ensureEntryId(undefined), label: "", value: "" },
        ],
      },
    }));
  };

  const patchCustomLine = (
    id: string,
    patch: Partial<Pick<PersonalCustomLine, "label" | "value">>,
  ) => {
    setState((s) => ({
      ...s,
      personal: {
        ...s.personal,
        customFields: s.personal.customFields.map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      },
    }));
  };

  const removeCustomLine = (id: string) => {
    setRenamingCustomFieldId((cur) => (cur === id ? null : cur));
    setState((s) => ({
      ...s,
      personal: {
        ...s.personal,
        customFields: s.personal.customFields.filter((row) => row.id !== id),
      },
    }));
  };

  const setJobPosition = (desiredJobPosition: string) => {
    setState((s) => {
      const personal = { ...s.personal, desiredJobPosition };
      let summary = s.summary;
      if (personal.useJobPositionAsHeadline) {
        summary = { ...s.summary, headline: desiredJobPosition };
      }
      return { ...s, personal, summary };
    });
  };

  const toggleHeadlineSync = () => {
    setState((s) => {
      const on = !s.personal.useJobPositionAsHeadline;
      const personal = { ...s.personal, useJobPositionAsHeadline: on };
      let summary = { ...s.summary };
      if (on && personal.desiredJobPosition.trim()) {
        summary.headline = personal.desiredJobPosition;
      }
      return { ...s, personal, summary };
    });
  };

  const onPhotoPick = async (file: File | undefined) => {
    if (!file) return;
    setPhotoPending(true);
    setPhotoError(null);
    try {
      const prepared = await prepareResumePhoto(file, {
        maxBytes: 1_200_000,
        maxDimension: 900,
      });
      setState((s) => ({
        ...s,
        personal: { ...s.personal, photoDataUrl: prepared.dataUrl },
      }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not use that photo.");
    } finally {
      setPhotoPending(false);
    }
  };

  function Pill({
    pillKey,
    label,
  }: {
    pillKey: PersonalPillKey;
    label: string;
  }) {
    return (
      <button
        type="button"
        onClick={() => addOptionalPill(pillKey)}
        className={OPTIONAL_PILL_CLASS}
      >
        <Plus className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  const optionalPillsRemaining = OPTIONAL_PILL_ORDER.filter((k) => !openPills.has(k));

  function OptionalFieldMenu({ pillKey }: { pillKey: PersonalPillKey }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="inline-flex size-10 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] shrink-0 items-center justify-center rounded-lg text-neutral-500 outline-none hover:bg-neutral-200/80 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 md:size-7 md:min-h-0 md:min-w-0"
          aria-label="Field options"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="min-w-[11rem] rounded-xl border border-neutral-200 bg-white p-0 py-1 shadow-lg ring-1 ring-black/[0.06]"
        >
          <div className="px-1.5">
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer rounded-md px-2.5 py-2 text-sm"
              onClick={() => removeOptionalPill(pillKey)}
            >
              Remove field
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function CustomLineFieldMenu({ lineId }: { lineId: string }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="inline-flex size-10 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] shrink-0 items-center justify-center rounded-lg text-neutral-500 outline-none hover:bg-neutral-200/80 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 md:size-7 md:min-h-0 md:min-w-0"
          aria-label="Field options"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="min-w-[11rem] rounded-xl border border-neutral-200 bg-white p-0 py-1 shadow-lg ring-1 ring-black/[0.06]"
        >
          <div className="px-1.5">
            <DropdownMenuItem
              className="cursor-pointer rounded-md px-2.5 py-2 text-sm focus:bg-neutral-100/90"
              onClick={() => setRenamingCustomFieldId(lineId)}
            >
              Rename field
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="bg-neutral-200/90" />
          <div className="px-1.5">
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer rounded-md px-2.5 py-2 text-sm"
              onClick={() => removeCustomLine(lineId)}
            >
              Remove field
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function openedOptionalInput(k: PersonalPillKey): ReactNode {
    switch (k) {
      case "dateOfBirth":
        return (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dob" className="text-label peer gap-0">
              Date of birth
            </Label>
            <div className="relative w-full">
              <Input
                id="dob"
                type="date"
                className={cn(
                  softInput,
                  "relative w-full min-w-0 pr-10 [color-scheme:light]",
                  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-calendar-picker-indicator]:flex [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:items-center [&::-webkit-calendar-picker-indicator]:justify-center [&::-webkit-calendar-picker-indicator]:opacity-0",
                  "[&::-moz-calendar-picker-indicator]:absolute [&::-moz-calendar-picker-indicator]:inset-y-0 [&::-moz-calendar-picker-indicator]:right-0 [&::-moz-calendar-picker-indicator]:z-10 [&::-moz-calendar-picker-indicator]:flex [&::-moz-calendar-picker-indicator]:w-10 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:items-center [&::-moz-calendar-picker-indicator]:justify-center [&::-moz-calendar-picker-indicator]:opacity-0",
                )}
                value={toHtmlDateInputValue(p.dateOfBirth)}
                onChange={(e) => updatePersonal({ dateOfBirth: e.target.value })}
              />
              <Calendar
                className="pointer-events-none absolute top-1/2 right-2.5 z-0 size-4 -translate-y-1/2 text-neutral-500"
                aria-hidden
              />
            </div>
          </div>
        );
      case "placeOfBirth":
        return (
          <Field id="pob" label="Place of birth" className="gap-1.5">
            <Input
              className={softInput}
              placeholder="City, country"
              value={p.placeOfBirth}
              onChange={(e) => updatePersonal({ placeOfBirth: e.target.value })}
            />
          </Field>
        );
      case "driversLicense":
        return (
          <Field id="license" label="Driver's license" className="gap-1.5">
            <Input
              className={softInput}
              placeholder="Class B — valid through 2028"
              value={p.driversLicense}
              onChange={(e) => updatePersonal({ driversLicense: e.target.value })}
            />
          </Field>
        );
      case "gender":
        return (
          <Field id="gender" label="Gender" className="gap-1.5">
            <Input
              className={softInput}
              value={p.gender}
              onChange={(e) => updatePersonal({ gender: e.target.value })}
            />
          </Field>
        );
      case "nationality":
        return (
          <Field id="nationality" label="Nationality" className="gap-1.5">
            <Input
              className={softInput}
              value={p.nationality}
              onChange={(e) => updatePersonal({ nationality: e.target.value })}
            />
          </Field>
        );
      case "civilStatus":
        return (
          <Field id="civil" label="Civil status" className="gap-1.5">
            <Input
              className={softInput}
              placeholder="Single / Married / …"
              value={p.civilStatus}
              onChange={(e) => updatePersonal({ civilStatus: e.target.value })}
            />
          </Field>
        );
      case "websitePill":
        return (
          <Field id="web-pill" label="Website" className="gap-1.5">
            <Input
              className={softInput}
              inputMode="url"
              placeholder="example.com"
              value={p.website}
              onChange={(e) => updatePersonal({ website: e.target.value })}
            />
          </Field>
        );
      case "linkedInPill":
        return (
          <Field id="li-pill" label="LinkedIn" className="gap-1.5">
            <Input
              className={softInput}
              inputMode="url"
              placeholder="linkedin.com/in/your-name"
              value={p.linkedIn}
              onChange={(e) => updatePersonal({ linkedIn: e.target.value })}
            />
          </Field>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {!isSectionFilled("personal", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Let&apos;s start with the essentials</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Your name and email power the header and contact block. You can always add more fields below.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="text-caption font-medium text-neutral-600">Photo</p>
          <label className="relative flex size-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-200 bg-neutral-100 transition-colors hover:border-neutral-300 hover:bg-neutral-50">
            <input
              type="file"
              accept={RESUME_PHOTO_INPUT_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                void onPhotoPick(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            {photoPending ? (
              <span className="flex flex-col items-center gap-2 text-xs font-medium text-neutral-500">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                Preparing
              </span>
            ) : p.photoDataUrl ? (
              <img src={p.photoDataUrl} alt="" className="size-full object-cover" />
            ) : (
              <>
                <Camera className="size-7 text-neutral-400" aria-hidden />
                <Plus className="absolute bottom-3 size-4 text-neutral-500" aria-hidden />
              </>
            )}
          </label>
          <p className="max-w-[120px] text-[0.68rem] leading-snug text-neutral-500">
            Choose from Photos or take a new picture.
          </p>
          {photoError ? (
            <p className="max-w-[160px] text-xs leading-snug text-destructive" role="alert">
              {photoError}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="firstName" label="First name" className="gap-1.5">
              <Input
                className={softInput}
                autoComplete="given-name"
                placeholder="Alex"
                value={p.givenName}
                onChange={(e) => updatePersonal({ givenName: e.target.value })}
              />
            </Field>
            <Field id="middleName" label="Middle name (optional)" className="gap-1.5">
              <Input
                className={softInput}
                autoComplete="additional-name"
                placeholder="Lee"
                value={p.middleName}
                onChange={(e) => updatePersonal({ middleName: e.target.value })}
              />
            </Field>
            <Field id="lastName" label="Last name" className="gap-1.5">
              <Input
                className={softInput}
                autoComplete="family-name"
                placeholder="Morgan"
                value={p.familyName}
                onChange={(e) => updatePersonal({ familyName: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Field
                id="desiredJob"
                label="Desired job position"
                className="min-w-0 flex-1 gap-1.5 [&>div]:!mt-0"
              >
                <Input
                  className={softInput}
                  placeholder="Product designer"
                  value={p.desiredJobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                />
              </Field>
              <div className="flex shrink-0 items-center gap-2 pt-6 sm:pt-7">
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.useJobPositionAsHeadline}
                  onClick={toggleHeadlineSync}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-neutral-200/80 bg-neutral-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40",
                    p.useJobPositionAsHeadline && "border-[#2268d7]/40 bg-[#2268d7]",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform",
                      p.useJobPositionAsHeadline && "translate-x-5",
                    )}
                  />
                </button>
                <span className="text-caption font-medium text-neutral-600">Use as headline</span>
              </div>
            </div>
            <p className="text-[0.7rem] text-neutral-500">
              When on, the Profile headline matches this line for the preview.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="email" label="Email address" className="gap-1.5">
          <Input
            className={softInput}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={p.email}
            onChange={(e) => setState((s) => ({ ...s, personal: { ...s.personal, email: e.target.value } }))}
          />
        </Field>
        <Field id="phone" label="Phone number" className="gap-1.5">
          <Input
            className={softInput}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 0100"
            value={p.phone}
            onChange={(e) => setState((s) => ({ ...s, personal: { ...s.personal, phone: e.target.value } }))}
          />
        </Field>
      </div>

      <Field id="address" label="Address" className="gap-1.5">
        <Input
          className={softInput}
          autoComplete="street-address"
          placeholder="Street, building, unit"
          value={p.address}
          onChange={(e) => updatePersonal({ address: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="postCode" label="Post code" className="gap-1.5">
          <Input
            className={softInput}
            autoComplete="postal-code"
            placeholder="10115"
            value={p.postCode}
            onChange={(e) => updatePersonal({ postCode: e.target.value })}
          />
        </Field>
        <Field id="city" label="City" className="gap-1.5">
          <Input
            className={softInput}
            autoComplete="address-level2"
            placeholder="Berlin"
            value={p.city}
            onChange={(e) => updatePersonal({ city: e.target.value })}
          />
        </Field>
      </div>

      <Field id="legacy-location" label="Location (short line)" className="gap-1.5">
        <Input
          className={softInput}
          placeholder="Optional: Berlin · Remote (used if address is empty)"
          value={p.location}
          onChange={(e) => updatePersonal({ location: e.target.value })}
        />
        <p className="text-[0.7rem] text-neutral-500">
          Shown on the resume if street address and city are not filled.
        </p>
      </Field>

      {openPills.size > 0 ||
      optionalPillsRemaining.length > 0 ||
      p.customFields.length > 0 ? (
        <div className="space-y-5 border-t border-neutral-100 pt-5">
          {openPills.size > 0 || p.customFields.length > 0 ? (
            <div className="space-y-4">
              {OPTIONAL_PILL_ORDER.filter((k) => openPills.has(k)).map((k) => (
                <div key={k} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">{openedOptionalInput(k)}</div>
                  <OptionalFieldMenu pillKey={k} />
                </div>
              ))}
              {p.customFields.map((line) => {
                const displayName = line.label.trim() || "Field name";
                const nameInputId = `customFieldName-${line.id}`;
                const valueInputId = `customFieldValue-${line.id}`;
                return (
                  <div key={line.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5">
                        {renamingCustomFieldId === line.id ? (
                          <>
                            <span className="sr-only" id={`${nameInputId}-caption`}>
                              Field name
                            </span>
                            <Input
                              id={nameInputId}
                              className={softInput}
                              placeholder="Field name"
                              value={line.label}
                              aria-describedby={`${nameInputId}-caption`}
                              onChange={(e) => patchCustomLine(line.id, { label: e.target.value })}
                              onBlur={() => setRenamingCustomFieldId(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") {
                                  e.preventDefault();
                                  setRenamingCustomFieldId(null);
                                }
                              }}
                            />
                          </>
                        ) : (
                          <Label htmlFor={valueInputId} className="text-label peer gap-0">
                            {displayName}
                          </Label>
                        )}
                        <Input
                          id={valueInputId}
                          className={softInput}
                          placeholder="e.g. EU Secret / Authorized to work in the US"
                          value={line.value}
                          onChange={(e) => patchCustomLine(line.id, { value: e.target.value })}
                        />
                      </div>
                    </div>
                    <CustomLineFieldMenu lineId={line.id} />
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-500">
              Optional fields
            </p>
            <div className="flex flex-wrap gap-2">
              {optionalPillsRemaining.map((pillKey) => (
                <Pill
                  key={pillKey}
                  pillKey={pillKey}
                  label={OPTIONAL_PILL_LABELS[pillKey]}
                />
              ))}
              <button type="button" onClick={addBlankCustomLine} className={OPTIONAL_PILL_CLASS}>
                <Plus className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
                <span className="truncate">{CUSTOM_FIELD_CHIP_LABEL}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryBody({
  state,
  setState,
  loginHref,
  jobAssist,
  aiAssistProjectId,
}: {
  state: WizardStateV1;
  setState: Setter;
  loginHref: string;
  jobAssist?: StudioJobAssistProps;
  aiAssistProjectId: string;
}) {
  return (
    <div className="space-y-4">
      {!isSectionFilled("summary", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Tell your story in a few lines</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            A clear headline plus a short profile helps recruiters understand you in seconds.
          </p>
        </div>
      ) : null}
      <Field
        id="headline"
        label="Headline"
        description="Your job title or role in one line—examples: Software engineer, Physician, Marketing manager, or High school teacher. Add a few keywords after if you like (e.g. Software engineer · TypeScript & cloud)."
        className="gap-1.5"
      >
        <Input
          className={softInput}
          placeholder="e.g. Software engineer · Backend & APIs"
          {...SUPPRESS_TEXT_ASSIST}
          value={state.summary.headline}
          onChange={(e) =>
            setState((s) => ({ ...s, summary: { ...s.summary, headline: e.target.value } }))
          }
        />
      </Field>
      <div className="space-y-2">
        <Label
          htmlFor="guest-profile-description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </Label>
        <ProfileDescriptionEditor
          id="guest-profile-description"
          value={state.summary.summary}
          onChange={(summary) =>
            setState((s) => ({ ...s, summary: { ...s.summary, summary } }))
          }
          loginHref={loginHref}
          signedIn
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          3–5 sentences: strengths, scope, and what you are looking for next.
        </p>
      </div>
      <div className="space-y-4 border-t border-neutral-200 pt-4">
        <SummaryAiPanel projectId={aiAssistProjectId} state={state} setState={setState} />
        {jobAssist ? (
          <SummaryJobTailorSection
            projectId={jobAssist.projectId}
            state={state}
            setState={setState}
            hasSavedJobTarget={jobAssist.hasSavedJobTarget}
            tailoringCompare={jobAssist.tailoringCompare}
            setTailoringCompare={jobAssist.setTailoringCompare}
          />
        ) : null}
      </div>
    </div>
  );
}

/** When one entry card is active, dim siblings (click-outside clears). */
function useDimInactiveEntryStack<T extends { id: string }>(entries: readonly T[]) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (activeEntryId === null) return;
    if (!entries.some((e) => e.id === activeEntryId)) {
      setActiveEntryId(null);
    }
  }, [entries, activeEntryId]);
  useEffect(() => {
    if (activeEntryId === null) return;
    const onDocDown = (e: MouseEvent) => {
      if (!stackRef.current?.contains(e.target as Node)) {
        setActiveEntryId(null);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [activeEntryId]);
  return { activeEntryId, setActiveEntryId, stackRef };
}

function emptyExperienceEntry() {
  return {
    id: ensureEntryId(undefined),
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    highlights: [""],
  };
}

function ExperienceBody({
  state,
  setState,
  jobAssist,
  aiAssistProjectId,
}: {
  state: WizardStateV1;
  setState: Setter;
  jobAssist?: StudioJobAssistProps;
  aiAssistProjectId: string;
}) {
  const entries = state.experience.entries;
  const { activeEntryId, setActiveEntryId, stackRef } = useDimInactiveEntryStack(entries);
  const addAnotherJob = () => {
    setActiveEntryId(null);
    setState((s) => ({
      ...s,
      experience: {
        entries: [...s.experience.entries, emptyExperienceEntry()],
      },
    }));
  };
  return (
    <div ref={stackRef} className="space-y-3">
      <div className="sticky top-0 z-[2] -mx-1 space-y-2 bg-neutral-50/95 px-1 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">
            {entries.length === 1
              ? "1 job so far — add each past employer separately"
              : `${entries.length} jobs listed`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="shrink-0 border-[#2d9f6d]/40 bg-white font-semibold text-slate-900 hover:bg-emerald-50"
            onClick={addAnotherJob}
          >
            <Plus className="size-4" aria-hidden />
            Add another job
          </Button>
        </div>
        <p className="text-[0.7rem] leading-snug text-muted-foreground">
          List 3–4 roles when you can. “Add highlight” only adds a bullet under the current job.
        </p>
      </div>
      {!isSectionFilled("experience", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Work history is the core of most resumes</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Start with your latest role, then use Add another job for earlier employers. Short bullets with
            results read best on phones and on paper.
          </p>
        </div>
      ) : null}
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={`${index + 1}. ${entry.title || entry.company || "New job"}`}
          subtitle={
            entry.startDate
              ? `${entry.startDate}${entry.current ? " — Present" : entry.endDate ? ` — ${entry.endDate}` : ""}`
              : null
          }
          onRemove={
            entries.length > 1
              ? () =>
                  setState((s) => ({
                    ...s,
                    experience: { entries: s.experience.entries.filter((_, i) => i !== index) },
                  }))
              : undefined
          }
          dimmed={activeEntryId !== null && activeEntryId !== entry.id}
          elevated={activeEntryId === entry.id}
          onActivate={() => setActiveEntryId(entry.id)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`exp-title-${entry.id}`} label="Job title">
              <Input
                value={entry.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = { ...next[index], title: v };
                    return { ...s, experience: { entries: next } };
                  });
                }}
                placeholder="Senior Product Designer"
              />
            </Field>
            <Field id={`exp-company-${entry.id}`} label="Employer">
              <Input
                value={entry.company}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = { ...next[index], company: v };
                    return { ...s, experience: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`exp-location-${entry.id}`} label="Location">
              <Input
                value={entry.location}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = { ...next[index], location: v };
                    return { ...s, experience: { entries: next } };
                  });
                }}
                placeholder="Remote · London"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id={`exp-start-${entry.id}`} label="Start">
                <Input
                  value={entry.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], startDate: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  placeholder="Jan 2022"
                />
              </Field>
              <Field id={`exp-end-${entry.id}`} label="End">
                <Input
                  disabled={entry.current}
                  value={entry.endDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], endDate: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  placeholder="Present"
                />
              </Field>
            </div>
          </div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-1 text-base leading-snug">
            <input
              type="checkbox"
              className="size-5 shrink-0 rounded border border-input accent-brand"
              checked={entry.current}
              onChange={(e) => {
                const checked = e.target.checked;
                setState((s) => {
                  const next = [...s.experience.entries];
                  next[index] = {
                    ...next[index],
                    current: checked,
                    endDate: checked ? "" : next[index].endDate,
                  };
                  return { ...s, experience: { entries: next } };
                });
              }}
            />
            I currently work here
          </label>
          <div className="mt-4 space-y-2">
            <div>
              <p className="text-[0.75rem] font-semibold tracking-wide text-muted-foreground">
                Job highlights
              </p>
              <p className="mt-1 max-w-prose text-[0.7rem] leading-snug text-muted-foreground">
                One accomplishment per box—what you did, how you did it, and the impact (add metrics when you
                have them).
              </p>
            </div>
            {entry.highlights.map((line, hi) => (
              <div key={`${entry.id}-h-${hi}`} className="space-y-1">
                <Textarea
                  value={line}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      const highlights = [...next[index].highlights];
                      highlights[hi] = v;
                      next[index] = { ...next[index], highlights };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  placeholder="Lead with impact — metric + action + outcome."
                />
                <ExperienceBulletAiControls
                  projectId={aiAssistProjectId}
                  entryId={entry.id}
                  company={entry.company}
                  title={entry.title}
                  bullet={line}
                  highlightIndex={hi}
                  targetRoleHint={
                    state.personal.desiredJobPosition.trim().length >= 3
                      ? state.personal.desiredJobPosition.trim()
                      : state.summary.headline.trim().length >= 3
                        ? state.summary.headline.trim()
                        : undefined
                  }
                  onApplyBullet={(text: string) =>
                    setState((s) => {
                      const next = [...s.experience.entries];
                      const highlights = [...next[index].highlights];
                      highlights[hi] = text;
                      next[index] = { ...next[index], highlights };
                      return { ...s, experience: { entries: next } };
                    })
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="w-full sm:w-auto"
              onClick={() =>
                setState((s) => {
                  const next = [...s.experience.entries];
                  const highlights = [...next[index].highlights, ""];
                  next[index] = { ...next[index], highlights };
                  return { ...s, experience: { entries: next } };
                })
              }
            >
              <Plus className="size-4" aria-hidden />
              Add highlight
            </Button>
          </div>
          {jobAssist ? (
            <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4">
              <ExperienceJobTailorSection
                projectId={jobAssist.projectId}
                entry={entry}
                hasSavedJobTarget={jobAssist.hasSavedJobTarget}
                tailoringCompare={jobAssist.tailoringCompare}
                setTailoringCompare={jobAssist.setTailoringCompare}
                onApplyBullets={(bullets) =>
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = {
                      ...next[index],
                      highlights: bullets.length > 0 ? bullets : [""],
                    };
                    return { ...s, experience: { entries: next } };
                  })
                }
              />
            </div>
          ) : null}
        </EntryCard>
      ))}
      <div className="space-y-1.5 pt-1">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="w-full justify-center border-slate-300 bg-white font-semibold text-slate-900 hover:bg-white"
          onClick={addAnotherJob}
        >
          <Plus className="size-4" aria-hidden />
          Add another job
        </Button>
        <p className="text-center text-[0.7rem] leading-snug text-muted-foreground">
          Adds a new employer to your work history (separate from highlights above).
        </p>
      </div>
    </div>
  );
}

function EducationBody({
  state,
  setState,
  aiAssistProjectId,
}: {
  state: WizardStateV1;
  setState: Setter;
  aiAssistProjectId: string;
}) {
  const entries = state.education.entries;
  const { activeEntryId, setActiveEntryId, stackRef } = useDimInactiveEntryStack(entries);
  return (
    <div ref={stackRef} className="space-y-3">
      {!isSectionFilled("education", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Education builds credibility fast</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Add your highest degree first, then certifications or courses if they matter for the role.
          </p>
        </div>
      ) : null}
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={entry.degree || entry.school || "New education entry"}
          subtitle={entry.startDate ? `${entry.startDate}${entry.endDate ? ` — ${entry.endDate}` : ""}` : null}
          onRemove={
            entries.length > 1
              ? () =>
                  setState((s) => ({
                    ...s,
                    education: { entries: s.education.entries.filter((_, i) => i !== index) },
                  }))
              : undefined
          }
          dimmed={activeEntryId !== null && activeEntryId !== entry.id}
          elevated={activeEntryId === entry.id}
          onActivate={() => setActiveEntryId(entry.id)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`edu-school-${entry.id}`} label="School">
              <Input
                value={entry.school}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = { ...next[index], school: v };
                    return { ...s, education: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`edu-degree-${entry.id}`} label="Degree">
              <Input
                value={entry.degree}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = { ...next[index], degree: v };
                    return { ...s, education: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`edu-field-${entry.id}`} label="Field of study">
              <Input
                value={entry.field}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = { ...next[index], field: v };
                    return { ...s, education: { entries: next } };
                  });
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id={`edu-start-${entry.id}`} label="Start">
                <Input
                  value={entry.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], startDate: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  placeholder="2018"
                />
              </Field>
              <Field id={`edu-end-${entry.id}`} label="End">
                <Input
                  value={entry.endDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], endDate: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  placeholder="2022"
                />
              </Field>
            </div>
          </div>
          <Field id={`edu-details-${entry.id}`} label="Details" className="mt-3">
            <Textarea
              className="min-h-[4rem]"
              value={entry.details}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => {
                  const next = [...s.education.entries];
                  next[index] = { ...next[index], details: v };
                  return { ...s, education: { entries: next } };
                });
              }}
              placeholder="Honors, thesis, coursework, GPA."
            />
          </Field>
          <EducationEntryAiPanel
            projectId={aiAssistProjectId}
            entry={entry}
            onApplyDetails={(details) => {
              setState((s) => {
                const next = [...s.education.entries];
                next[index] = { ...next[index], details };
                return { ...s, education: { entries: next } };
              });
            }}
          />
        </EntryCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className={cn(
          "w-full justify-center motion-safe:transition-[opacity,filter] motion-safe:duration-200",
          activeEntryId !== null && "opacity-[0.42] saturate-[0.65]",
        )}
        onClick={() => {
          setActiveEntryId(null);
          setState((s) => ({
            ...s,
            education: {
              entries: [
                ...s.education.entries,
                {
                  id: ensureEntryId(undefined),
                  school: "",
                  degree: "",
                  field: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  details: "",
                },
              ],
            },
          }));
        }}
      >
        <Plus className="size-4" aria-hidden />
        Add education
      </Button>
    </div>
  );
}

function LinesBlockBody({
  id,
  label,
  description,
  placeholder,
  value,
  onChange,
  isExample = false,
}: {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (lines: string) => void;
  isExample?: boolean;
}) {
  return (
    <div className="space-y-3">
      {isExample ? <ExampleContentNotice what={label.toLowerCase()} /> : null}
      <Field id={id} label={label} description={description}>
        <Textarea
          className="min-h-[10rem]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </Field>
    </div>
  );
}

function SkillsBody({
  state,
  setState,
  jobAssist,
  aiAssistProjectId,
}: {
  state: WizardStateV1;
  setState: Setter;
  jobAssist?: StudioJobAssistProps;
  aiAssistProjectId: string;
}) {
  return (
    <div className="space-y-4">
      {!state.skills.lines.trim() ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">List the skills you want to be known for</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            One per line is easiest to edit on your phone. You can reorder later.
          </p>
        </div>
      ) : null}
      <Field
        id="skills"
        label="Skills"
        description="Add the skills you have — one per line."
      >
        <Textarea
          className="min-h-[10rem]"
          value={state.skills.lines}
          onChange={(e) => setState((s) => ({ ...s, skills: { lines: e.target.value } }))}
          placeholder={"TypeScript\nReact\nProduct strategy\nDesign systems"}
        />
      </Field>
      <div className="space-y-4 border-t border-neutral-200 pt-4">
        <SkillsAiPanel
          projectId={aiAssistProjectId}
          lines={state.skills.lines}
          onApplyLines={(lines) => setState((s) => ({ ...s, skills: { lines } }))}
        />
        {jobAssist ? (
          <SkillsJobTailorSection
            projectId={jobAssist.projectId}
            lines={state.skills.lines}
            setLines={(lines) => setState((s) => ({ ...s, skills: { lines } }))}
            hasSavedJobTarget={jobAssist.hasSavedJobTarget}
            tailoringCompare={jobAssist.tailoringCompare}
            setTailoringCompare={jobAssist.setTailoringCompare}
          />
        ) : null}
      </div>
    </div>
  );
}

function ProjectsBody({
  state,
  setState,
  isExample = false,
}: {
  state: WizardStateV1;
  setState: Setter;
  isExample?: boolean;
}) {
  const entries = state.projects.entries;
  const { activeEntryId, setActiveEntryId, stackRef } = useDimInactiveEntryStack(entries);
  return (
    <div ref={stackRef} className="space-y-3">
      {isExample ? <ExampleContentNotice what="project" /> : null}
      {!isSectionFilled("projects", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Show work you are proud to explain</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Side projects, open source, or client work all count — focus on impact, not buzzwords.
          </p>
        </div>
      ) : null}
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={entry.name || "New project"}
          subtitle={entry.technologies || null}
          onRemove={
            entries.length > 1
              ? () =>
                  setState((s) => ({
                    ...s,
                    projects: { entries: s.projects.entries.filter((_, i) => i !== index) },
                  }))
              : undefined
          }
          dimmed={activeEntryId !== null && activeEntryId !== entry.id}
          elevated={activeEntryId === entry.id}
          onActivate={() => setActiveEntryId(entry.id)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`proj-name-${entry.id}`} label="Project name">
              <Input
                value={entry.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], name: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`proj-url-${entry.id}`} label="URL">
              <Input
                value={entry.url}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], url: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
                placeholder="https://..."
              />
            </Field>
          </div>
          <Field id={`proj-tech-${entry.id}`} label="Tech" className="mt-3">
            <Input
              value={entry.technologies}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => {
                  const next = [...s.projects.entries];
                  next[index] = { ...next[index], technologies: v };
                  return { ...s, projects: { entries: next } };
                });
              }}
              placeholder="React, TypeScript, Postgres"
            />
          </Field>
          <Field id={`proj-desc-${entry.id}`} label="Description" className="mt-3">
            <Textarea
              className="min-h-[6.5rem] md:min-h-[5rem]"
              value={entry.description}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => {
                  const next = [...s.projects.entries];
                  next[index] = { ...next[index], description: v };
                  return { ...s, projects: { entries: next } };
                });
              }}
              placeholder="What you built, for whom, and the measurable outcome."
            />
          </Field>
        </EntryCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className={cn(
          "w-full justify-center motion-safe:transition-[opacity,filter] motion-safe:duration-200",
          activeEntryId !== null && "opacity-[0.42] saturate-[0.65]",
        )}
        onClick={() => {
          setActiveEntryId(null);
          setState((s) => ({
            ...s,
            projects: {
              entries: [
                ...s.projects.entries,
                {
                  id: ensureEntryId(undefined),
                  name: "",
                  url: "",
                  description: "",
                  technologies: "",
                },
              ],
            },
          }));
        }}
      >
        <Plus className="size-4" aria-hidden />
        Add project
      </Button>
    </div>
  );
}

function CertificationsBody({
  state,
  setState,
  isExample = false,
}: {
  state: WizardStateV1;
  setState: Setter;
  isExample?: boolean;
}) {
  const entries = state.certifications.entries;
  const { activeEntryId, setActiveEntryId, stackRef } = useDimInactiveEntryStack(entries);
  return (
    <div ref={stackRef} className="space-y-3">
      {isExample ? <ExampleContentNotice what="certification" /> : null}
      {!isSectionFilled("certifications", state) ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Certifications signal credibility</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Add the name as it appears on the certificate plus who issued it.
          </p>
        </div>
      ) : null}
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={entry.name || "New certification"}
          subtitle={entry.issuer || null}
          onRemove={
            entries.length > 1
              ? () =>
                  setState((s) => ({
                    ...s,
                    certifications: {
                      entries: s.certifications.entries.filter((_, i) => i !== index),
                    },
                  }))
              : undefined
          }
          dimmed={activeEntryId !== null && activeEntryId !== entry.id}
          elevated={activeEntryId === entry.id}
          onActivate={() => setActiveEntryId(entry.id)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`cert-name-${entry.id}`} label="Name">
              <Input
                value={entry.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], name: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`cert-issuer-${entry.id}`} label="Issuer">
              <Input
                value={entry.issuer}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], issuer: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
              />
            </Field>
            <Field id={`cert-issued-${entry.id}`} label="Issued">
              <Input
                value={entry.issued}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], issued: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                placeholder="2024"
              />
            </Field>
            <Field id={`cert-expires-${entry.id}`} label="Expires">
              <Input
                value={entry.expires}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], expires: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                placeholder="—"
              />
            </Field>
          </div>
        </EntryCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className={cn(
          "w-full justify-center motion-safe:transition-[opacity,filter] motion-safe:duration-200",
          activeEntryId !== null && "opacity-[0.42] saturate-[0.65]",
        )}
        onClick={() => {
          setActiveEntryId(null);
          setState((s) => ({
            ...s,
            certifications: {
              entries: [
                ...s.certifications.entries,
                {
                  id: ensureEntryId(undefined),
                  name: "",
                  issuer: "",
                  issued: "",
                  expires: "",
                },
              ],
            },
          }));
        }}
      >
        <Plus className="size-4" aria-hidden />
        Add certification
      </Button>
    </div>
  );
}

function AdditionalBody({
  state,
  setState,
  aiAssistProjectId,
}: {
  state: WizardStateV1;
  setState: Setter;
  aiAssistProjectId: string;
}) {
  return (
    <div className="space-y-4">
      {!state.additional.notes.trim() ? (
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Optional — only if it strengthens your story</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Volunteering, awards, or publications fit well here. Skip this section if you do not need it.
          </p>
        </div>
      ) : null}
      <Field
        id="additional"
        label="Additional information"
        description="Volunteering, awards, publications — anything that did not fit above."
      >
        <Textarea
          className="min-h-[8rem]"
          value={state.additional.notes}
          onChange={(e) => setState((s) => ({ ...s, additional: { notes: e.target.value } }))}
          placeholder={"Volunteer: Code mentor at local non-profit, 2022–2024\nAwards: Dean's list …"}
        />
      </Field>
      <div className="border-t border-neutral-200 pt-4">
        <AdditionalAiPanel
          projectId={aiAssistProjectId}
          text={state.additional.notes}
          onApply={(text) => setState((s) => ({ ...s, additional: { notes: text } }))}
        />
      </div>
    </div>
  );
}

function EntryCard({
  title,
  subtitle,
  onRemove,
  children,
  dimmed = false,
  elevated = false,
  onActivate,
}: {
  title: string;
  subtitle?: string | null;
  onRemove?: () => void;
  children: ReactNode;
  /** When another card in the stack is active, this card is visually de-emphasized. */
  dimmed?: boolean;
  /** Subtle emphasis for the card the user is editing. */
  elevated?: boolean;
  onActivate?: () => void;
}) {
  return (
    <div
      data-studio-entry-card
      onPointerDownCapture={() => onActivate?.()}
      onFocusCapture={() => onActivate?.()}
      className={cn(
        "rounded-lg border border-border/70 bg-white p-4 motion-safe:transition-[opacity,filter,box-shadow,ring-color] motion-safe:duration-200 motion-safe:ease-out sm:p-4",
        dimmed && "pointer-events-auto opacity-[0.42] saturate-[0.68] contrast-[0.98]",
        elevated &&
          "relative z-[1] opacity-100 ring-2 ring-[#2d9f6d]/35 shadow-sm contrast-100 saturate-100",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive md:size-8"
            aria-label="Remove entry"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
