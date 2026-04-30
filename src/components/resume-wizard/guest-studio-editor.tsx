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
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileUp,
  GripVertical,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MoreVertical,
  Plus,
  SquareSplitHorizontal,
  Tag,
  Trash2,
  ZoomOut,
} from "lucide-react";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { useGuestWizardAutosave } from "@/hooks/use-guest-wizard-autosave";
import type { SaveStatus } from "@/hooks/use-wizard-autosave";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { isProfileDescriptionEmpty } from "@/lib/profile-description-html";
import { ensureEntryId } from "@/lib/resume-wizard/ids";
import { DEFAULT_GUEST_STUDIO_SECTION_ORDER } from "@/lib/resume-wizard/section-order";
import type { WizardEditorSectionId, WizardStateV1 } from "@/lib/resume-wizard/types";
import {
  AdditionalAiPanel,
  ExperienceEntryAiPanel,
  SkillsAiPanel,
  SummaryAiPanel,
} from "@/components/resume-wizard/wizard-ai-panels";
import {
  ExperienceJobTailorSection,
  SkillsJobTailorSection,
  SummaryJobTailorSection,
} from "@/components/resume-wizard/job-tailor-sections";
import { ProfileDescriptionEditor } from "@/components/resume-wizard/profile-description-editor";
import { ResumeStudioSplitLayout } from "@/components/resume-wizard/resume-studio-split-layout";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import { cn } from "@/lib/utils";

type SectionId = WizardEditorSectionId;

type SectionDef = {
  id: SectionId;
  label: string;
  hint?: string;
};

/** Order matches common resume/CV builders: profile → education → work → supporting sections. */
const SECTIONS: SectionDef[] = [
  { id: "personal", label: "Personal details" },
  { id: "summary", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Employment" },
  { id: "skills", label: "Skills" },
  { id: "languages", label: "Languages" },
  { id: "hobbies", label: "Hobbies" },
  { id: "courses", label: "Courses" },
  { id: "internships", label: "Internships" },
  { id: "certifications", label: "Certificates" },
  { id: "projects", label: "Projects" },
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

/** Soft inputs used in the accordion header and section bodies. */
const softInput =
  "border-0 bg-neutral-100 shadow-inner shadow-black/[0.04] transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#2268d7]/25";

/** Optional: signed-in `/build` — AI assist + job-posting tailoring (shared with the step-form module). */
export type StudioJobAssistProps = {
  projectId: string;
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
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
  /** Signed avatar URL for live preview (project drafts only). */
  previewAvatarUrl?: string | null;
  jobAssist?: StudioJobAssistProps;
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
  previewAvatarUrl = null,
  jobAssist,
}: StudioEditorProps) {
  const state = content;
  const setState = onContentChange;

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

  const orderedSections = useMemo((): SectionDef[] => {
    return sectionOrderResolved
      .map((id) => SECTIONS.find((s) => s.id === id))
      .filter((s): s is SectionDef => Boolean(s));
  }, [sectionOrderResolved]);

  const exportHref =
    persistMode === "project" && projectPreviewHref
      ? projectPreviewHref
      : loginHref;

  // Only one section is expanded at a time — keeps the left panel calm and focused.
  const [openSection, setOpenSection] = useState<SectionId | null>("personal");
  const [sectionLabelOverrides, setSectionLabelOverrides] = useState<
    Partial<Record<SectionId, string>>
  >({});
  const [editingSectionTitleId, setEditingSectionTitleId] = useState<SectionId | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState("");

  const toggleSection = useCallback((id: SectionId) => {
    setOpenSection((cur) => (cur === id ? null : id));
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

  // Mobile-only: editor is shown by default; preview is reachable via a toggle
  // so the entire screen never needs to scroll beyond the viewport.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Bottom preview toolbar state.
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  /** While hovering a template in the strip, preview uses this slug without committing. */
  const [templateHoverSlug, setTemplateHoverSlug] = useState<TemplateSlug | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  /** Fit-to-panel (no inner scroll) until user clicks the preview, then 1:1 + scroll. */
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  /** Unscaled content size — used to clip + center the scaled preview in fit mode. */
  const [fitContentSize, setFitContentSize] = useState({ w: 0, h: 0 });
  const previewFitBodyRef = useRef<HTMLDivElement | null>(null);
  const previewMeasureRef = useRef<HTMLDivElement | null>(null);
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

  useLayoutEffect(() => {
    if (previewZoomed) {
      setFitScale(1);
      return;
    }
    const container = previewFitBodyRef.current;
    const content = previewMeasureRef.current;
    if (!container || !content) return;

    const measure = () => {
      // While hovering templates, content height can change — keep scale stable.
      if (templateHoverSlug) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const mw = Math.max(content.scrollWidth, content.offsetWidth);
      const mh = Math.max(content.scrollHeight, content.offsetHeight);
      if (mw <= 0 || mh <= 0 || cw <= 0 || ch <= 0) return;
      const s = Math.min(cw / mw, ch / mh, 1);
      setFitContentSize({ w: mw, h: mh });
      setFitScale((prev) => (Math.abs(prev - s) > 0.001 ? s : prev));
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [previewZoomed, previewDocument, templateSlug, resumeStyle, templateHoverSlug]);

  return (
    <ResumeStudioSplitLayout
      focusMode={focusMode}
      mobilePreviewOpen={mobilePreviewOpen}
      previewAccent={previewTheme.accent}
      editor={(
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          {persistMode === "guest" ? (
            <SaveBadge
              status={guestAutosave.saveStatus}
              error={guestAutosave.lastError}
              onRetry={guestAutosave.retry}
            />
          ) : null}

          <IntakeShortcuts />

          <nav
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
            aria-label="Resume sections"
          >
            {orderedSections.map((section) => {
              const idx = sectionOrderResolved.indexOf(section.id);
              const canMoveUp = idx > 0;
              const canMoveDown = idx >= 0 && idx < sectionOrderResolved.length - 1;
              return (
              <div
                key={section.id}
                className="border-t border-neutral-200 first:border-t-0"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
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
                open={openSection === section.id}
                onToggle={() => toggleSection(section.id)}
                filled={isSectionFilled(section.id, state)}
                titleEditing={editingSectionTitleId === section.id}
                titleDraft={sectionTitleDraft}
                onTitleDraftChange={setSectionTitleDraft}
                onTitleCommit={() => commitSectionTitle(section.id, section.label)}
                onTitleCancel={cancelSectionTitleEdit}
                sectionReorder={
                  canMoveUp || canMoveDown
                    ? {
                        canMoveUp,
                        canMoveDown,
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
                      }
                    : undefined
                }
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
                />
              </SectionCard>
              </div>
            );
            })}
          </nav>

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
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-sm outline-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 sm:text-[0.8125rem]"
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
              <Link
                href={exportHref}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center gap-1.5 self-end rounded-full bg-[#2268d7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f5fca] sm:self-auto",
                )}
                aria-label={
                  persistMode === "project"
                    ? "Open Preview and export"
                    : "Sign in to download as PDF"
                }
              >
                <Download className="size-4 shrink-0" aria-hidden />
                {persistMode === "project" ? "Preview & export" : "Download"}
              </Link>
            </div>
          </footer>

          <p className="pt-4 pb-10 text-center text-xs text-muted-foreground">
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
                Draft content saves automatically to this project.{" "}
                <Link
                  href={exportHref}
                  className="font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Preview &amp; export
                </Link>{" "}
                for templates and PDFs.
              </>
            )}
          </p>
        </div>
      )}
      preview={(
        <>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4 sm:px-5 sm:py-5">
          {/* Floating controls — not part of the template; keeps the canvas = one real sheet */}
          <div className="pointer-events-none absolute right-4 top-4 z-50 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 sm:right-6 sm:top-5">
            <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 rounded-full border border-border/70 bg-white/95 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground shadow-md backdrop-blur-sm dark:bg-zinc-900/95 dark:text-zinc-200">
              {previewZoomed ? (
                <button
                  type="button"
                  onClick={() => setPreviewZoomed(false)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                  aria-label="Shrink preview to fit panel"
                >
                  <ZoomOut className="size-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Fit to panel</span>
                  <span className="sm:hidden">Fit</span>
                </button>
              ) : (
                <span className="hidden px-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground sm:inline">
                  Click sheet to zoom
                </span>
              )}
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
            {/* Fit: scaled sheet centered H+V, fully visible, no scroll. Zoomed: 1:1 + scroll. */}
            <div
              ref={previewFitBodyRef}
              className={cn(
                "relative min-h-0 w-full flex-1",
                previewZoomed
                  ? "cursor-default overflow-y-auto overflow-x-auto px-1 py-10 sm:px-2"
                  : "cursor-zoom-in overflow-hidden",
              )}
              onClick={(e) => {
                if (previewZoomed) return;
                const t = e.target as HTMLElement;
                if (
                  t.closest(
                    "button,a,input,select,textarea,[role='dialog'],[role='link'],[data-prevent-zoom]",
                  )
                ) {
                  return;
                }
                setPreviewZoomed(true);
              }}
              onKeyDown={(e) => {
                if (previewZoomed) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPreviewZoomed(true);
                }
              }}
              role={previewZoomed ? undefined : "button"}
              tabIndex={previewZoomed ? undefined : 0}
              aria-label={previewZoomed ? undefined : "Zoom preview — click to enlarge and scroll"}
            >
              {previewZoomed ? (
                <div ref={previewMeasureRef} className="inline-block min-w-0 max-w-full py-2 sm:px-1">
                  <PreviewViewport presentation="document" clipCanvas={false}>
                    <ResumePreviewRenderer
                      document={previewDocument}
                      templateSlug={previewTemplateSlug}
                      resumeStyle={resumeStyle}
                    />
                  </PreviewViewport>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-4">
                  {fitContentSize.w > 0 && fitContentSize.h > 0 ? (
                    <div
                      className="overflow-hidden rounded-[2px]"
                      style={{
                        width: fitContentSize.w * fitScale,
                        height: fitContentSize.h * fitScale,
                      }}
                    >
                      <div
                        ref={previewMeasureRef}
                        className="inline-block min-w-0 origin-top-left will-change-transform"
                        style={{
                          transform: `scale(${fitScale})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <PreviewViewport presentation="document" clipCanvas>
                          <ResumePreviewRenderer
                            document={previewDocument}
                            templateSlug={previewTemplateSlug}
                            resumeStyle={resumeStyle}
                          />
                        </PreviewViewport>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={previewMeasureRef}
                      className="inline-block min-w-0 max-w-full origin-center will-change-transform"
                      style={{
                        transform: `scale(${fitScale})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <PreviewViewport presentation="document" clipCanvas>
                        <ResumePreviewRenderer
                          document={previewDocument}
                          templateSlug={previewTemplateSlug}
                          resumeStyle={resumeStyle}
                        />
                      </PreviewViewport>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom preview toolbar — template strip is absolutely positioned so it does not shrink the preview column */}
        <div
          ref={toolbarRef}
          className="sticky bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur-md"
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
                        "absolute left-1 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-800 shadow-[0_4px_18px_rgba(15,23,42,0.14),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-sm outline-none transition-[transform,box-shadow,background-color,border-color,opacity] sm:left-1.5",
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
                    {TEMPLATE_SLUG_ORDER.map((slug) => {
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
                            "flex shrink-0 flex-col items-center gap-1.5 rounded-lg p-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2268d7]/40",
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
                          <span className="max-w-[5.5rem] text-center text-[0.65rem] font-semibold leading-tight whitespace-normal break-words text-slate-800 sm:text-xs">
                            {theme.name}
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
                        "absolute right-1 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-800 shadow-[0_4px_18px_rgba(15,23,42,0.14),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-sm outline-none transition-[transform,box-shadow,background-color,border-color,opacity] sm:right-1.5",
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

            <div className="flex items-center justify-between gap-2">
            {/* Templates */}
            <ToolbarButton
              variant="templates"
              active={templatesOpen}
              onClick={() => {
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
              <span className="hidden sm:inline">Templates</span>
              {templatesOpen ? (
                <ChevronUp className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              )}
            </ToolbarButton>

            <div className="flex items-center gap-1">
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
                className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
      mobileFab={(
        <button
          type="button"
          onClick={() => setMobilePreviewOpen((v) => !v)}
          aria-pressed={mobilePreviewOpen}
          aria-label={mobilePreviewOpen ? "Show editor" : "Show preview"}
          className={cn(
            "fixed bottom-4 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg ring-1 ring-black/10 transition-transform hover:-translate-y-0.5 active:translate-y-0",
            "lg:hidden",
          )}
        >
          {mobilePreviewOpen ? "Edit" : "Preview"}
        </button>
      )}
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
        "inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors sm:text-sm",
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
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 sm:text-[0.8125rem]"
    >
      <Plus className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function SaveBadge({
  status,
  error,
  onRetry,
}: {
  status: SaveStatus;
  error: string | null;
  onRetry: () => void;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1";
  if (status === "saving") {
    return (
      <div className={cn(base, "bg-muted/50 text-muted-foreground ring-border")}>
        Saving locally…
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
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(base, "bg-destructive/12 text-destructive ring-destructive/25")}
      >
        {error ?? "Save failed — retry"}
      </button>
    );
  }
  return (
    <div className={cn(base, "bg-brand-muted text-brand ring-brand/15")}>Local draft</div>
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

function IntakeShortcuts() {
  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        className="inline-flex min-h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-white px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
      >
        <FileUp className="size-4" aria-hidden />
        Upload existing resume
      </button>
      <button
        type="button"
        className="inline-flex min-h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-white px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
      >
        <span className="inline-flex size-4 items-center justify-center rounded-[3px] bg-[#0a66c2] text-[0.55rem] font-bold text-white">
          in
        </span>
        Import LinkedIn profile
      </button>
    </section>
  );
}

function SectionCard({
  section,
  displayLabel,
  open,
  onToggle,
  filled,
  titleEditing,
  titleDraft,
  onTitleDraftChange,
  onTitleCommit,
  onTitleCancel,
  headerMenu,
  sectionReorder,
  children,
}: {
  section: SectionDef;
  displayLabel: string;
  open: boolean;
  onToggle: () => void;
  filled: boolean;
  titleEditing: boolean;
  titleDraft: string;
  onTitleDraftChange: (value: string) => void;
  onTitleCommit: () => void;
  onTitleCancel: () => void;
  headerMenu: ReactNode;
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
      className={cn(open && "bg-neutral-50/60")}
    >
      <div className="flex w-full items-center gap-2 px-4 py-[1.05rem] sm:py-[1.15rem] sm:pl-5 sm:pr-4">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", section.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          className="inline-flex shrink-0 cursor-grab touch-none text-neutral-400 hover:text-neutral-500"
          aria-label="Drag to reorder sections"
          title="Drag to reorder sections"
        >
          <GripVertical className="size-4" aria-hidden />
        </span>
        {sectionReorder ? (
          <div
            className="flex shrink-0 flex-col gap-px"
            role="group"
            aria-label={`Reorder ${displayLabel}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!sectionReorder.canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                sectionReorder.onMoveUp();
              }}
              className="size-7 shrink-0 text-neutral-500 hover:text-neutral-800 disabled:opacity-30"
              aria-label={`Move ${displayLabel} up in the list`}
            >
              <ChevronUp className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!sectionReorder.canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                sectionReorder.onMoveDown();
              }}
              className="size-7 shrink-0 text-neutral-500 hover:text-neutral-800 disabled:opacity-30"
              aria-label={`Move ${displayLabel} down in the list`}
            >
              <ChevronDown className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}
        {titleEditing ? (
          <div
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
            onClick={onToggle}
            aria-expanded={open}
            className="min-w-0 flex-1 truncate text-left text-[0.95rem] font-semibold tracking-tight transition-colors"
          >
            <span
              className={cn(
                open ? "text-[#2268d7]" : "text-neutral-500",
                filled && !open && "text-neutral-600",
              )}
            >
              {displayLabel}
            </span>
          </button>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {open ? headerMenu : null}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Collapse section" : "Expand section"}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              open
                ? "border-[#2268d7] bg-[#2268d7]/8 text-[#2268d7]"
                : filled
                  ? "border-neutral-300 text-neutral-500"
                  : "border-neutral-300 text-neutral-400",
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
        <div className="border-t border-neutral-200/90 bg-white px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
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

/* ------------------------------ Section bodies ---------------------------- */

function SectionBody({
  section,
  state,
  setState,
  loginHref,
  jobAssist,
}: {
  section: SectionId;
  state: WizardStateV1;
  setState: Dispatch<SetStateAction<WizardStateV1>>;
  loginHref: string;
  jobAssist?: StudioJobAssistProps;
}) {
  switch (section) {
    case "personal":
      return <PersonalBody state={state} setState={setState} />;
    case "summary":
      return (
        <SummaryBody state={state} setState={setState} loginHref={loginHref} jobAssist={jobAssist} />
      );
    case "experience":
      return <ExperienceBody state={state} setState={setState} jobAssist={jobAssist} />;
    case "education":
      return <EducationBody state={state} setState={setState} />;
    case "skills":
      return <SkillsBody state={state} setState={setState} jobAssist={jobAssist} />;
    case "languages":
      return (
        <LinesBlockBody
          id="languages"
          label="Languages"
          description="One language per line. You can add proficiency (e.g. English — native, Spanish — B2)."
          placeholder={"English — Native\nSpanish — Professional working proficiency"}
          value={state.languages.lines}
          onChange={(lines) => setState((s) => ({ ...s, languages: { lines } }))}
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
      return <ProjectsBody state={state} setState={setState} />;
    case "certifications":
      return <CertificationsBody state={state} setState={setState} />;
    case "additional":
      return <AdditionalBody state={state} setState={setState} jobAssist={jobAssist} />;
    default:
      return null;
  }
}

type Setter = Dispatch<SetStateAction<WizardStateV1>>;

type PersonalPillKey =
  | "dateOfBirth"
  | "placeOfBirth"
  | "driversLicense"
  | "gender"
  | "nationality"
  | "civilStatus"
  | "websitePill"
  | "linkedInPill"
  | "custom";

function PersonalBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  const p = state.personal;
  const [openPills, setOpenPills] = useState<Set<PersonalPillKey>>(() => new Set());

  const togglePill = (key: PersonalPillKey) => {
    setOpenPills((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
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

  const onPhotoPick = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 1.5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;
      setState((s) => ({ ...s, personal: { ...s.personal, photoDataUrl: dataUrl } }));
    };
    reader.readAsDataURL(file);
  };

  function Pill({
    pillKey,
    label,
  }: {
    pillKey: PersonalPillKey;
    label: string;
  }) {
    const open = openPills.has(pillKey);
    return (
      <button
        type="button"
        onClick={() => togglePill(pillKey)}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 sm:text-[0.8125rem]"
      >
        {open ? (
          <ChevronUp className="size-3.5 shrink-0 text-[#2268d7]" aria-hidden />
        ) : (
          <Plus className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
        )}
        <span className="truncate">{label}</span>
      </button>
    );
  }

  const hasOpenOptional = openPills.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="text-caption font-medium text-neutral-600">Photo</p>
          <label className="relative flex size-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-200 bg-neutral-100 transition-colors hover:border-neutral-300 hover:bg-neutral-50">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPhotoPick(e.target.files?.[0])}
            />
            {p.photoDataUrl ? (
              <img src={p.photoDataUrl} alt="" className="size-full object-cover" />
            ) : (
              <>
                <Camera className="size-7 text-neutral-400" aria-hidden />
                <Plus className="absolute bottom-3 size-4 text-neutral-500" aria-hidden />
              </>
            )}
          </label>
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

      <div className="space-y-3 border-t border-neutral-100 pt-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-500">
          Optional fields
        </p>
        <div
          className={cn(
            "space-y-4",
            hasOpenOptional && "border-b border-neutral-100 pb-4",
          )}
        >
          {openPills.has("dateOfBirth") ? (
            <Field id="dob" label="Date of birth" className="gap-1.5">
              <Input
                className={softInput}
                placeholder="1992-04-18"
                value={p.dateOfBirth}
                onChange={(e) => updatePersonal({ dateOfBirth: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("placeOfBirth") ? (
            <Field id="pob" label="Place of birth" className="gap-1.5">
              <Input
                className={softInput}
                placeholder="City, country"
                value={p.placeOfBirth}
                onChange={(e) => updatePersonal({ placeOfBirth: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("driversLicense") ? (
            <Field id="license" label="Driver's license" className="gap-1.5">
              <Input
                className={softInput}
                placeholder="Class B — valid through 2028"
                value={p.driversLicense}
                onChange={(e) => updatePersonal({ driversLicense: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("gender") ? (
            <Field id="gender" label="Gender" className="gap-1.5">
              <Input
                className={softInput}
                value={p.gender}
                onChange={(e) => updatePersonal({ gender: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("nationality") ? (
            <Field id="nationality" label="Nationality" className="gap-1.5">
              <Input
                className={softInput}
                value={p.nationality}
                onChange={(e) => updatePersonal({ nationality: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("civilStatus") ? (
            <Field id="civil" label="Civil status" className="gap-1.5">
              <Input
                className={softInput}
                placeholder="Single / Married / …"
                value={p.civilStatus}
                onChange={(e) => updatePersonal({ civilStatus: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("websitePill") ? (
            <Field id="web-pill" label="Website" className="gap-1.5">
              <Input
                className={softInput}
                inputMode="url"
                placeholder="example.com"
                value={p.website}
                onChange={(e) => updatePersonal({ website: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("linkedInPill") ? (
            <Field id="li-pill" label="LinkedIn" className="gap-1.5">
              <Input
                className={softInput}
                inputMode="url"
                placeholder="linkedin.com/in/your-name"
                value={p.linkedIn}
                onChange={(e) => updatePersonal({ linkedIn: e.target.value })}
              />
            </Field>
          ) : null}
          {openPills.has("custom") ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="customLabel" label="Field label" className="gap-1.5">
                <Input
                  className={softInput}
                  placeholder="Security clearance"
                  value={p.customFieldLabel}
                  onChange={(e) => updatePersonal({ customFieldLabel: e.target.value })}
                />
              </Field>
              <Field id="customValue" label="Value" className="gap-1.5">
                <Input
                  className={softInput}
                  placeholder="EU Secret"
                  value={p.customFieldValue}
                  onChange={(e) => updatePersonal({ customFieldValue: e.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill pillKey="dateOfBirth" label="Date of birth" />
          <Pill pillKey="placeOfBirth" label="Place of birth" />
          <Pill pillKey="driversLicense" label="Driver's license" />
          <Pill pillKey="gender" label="Gender" />
          <Pill pillKey="nationality" label="Nationality" />
          <Pill pillKey="civilStatus" label="Civil status" />
          <Pill pillKey="websitePill" label="Website" />
          <Pill pillKey="linkedInPill" label="LinkedIn" />
          <Pill pillKey="custom" label="Custom field" />
        </div>
      </div>
    </div>
  );
}

function SummaryBody({
  state,
  setState,
  loginHref,
  jobAssist,
}: {
  state: WizardStateV1;
  setState: Setter;
  loginHref: string;
  jobAssist?: StudioJobAssistProps;
}) {
  return (
    <div className="space-y-4">
      <Field id="headline" label="Headline" className="gap-1.5">
        <Input
          className={softInput}
          placeholder="Product designer · Design systems · B2B SaaS"
          value={state.summary.headline}
          onChange={(e) =>
            setState((s) => ({ ...s, summary: { ...s.summary, headline: e.target.value } }))
          }
        />
      </Field>
      <div className="space-y-1.5">
        <label
          htmlFor="guest-profile-description"
          className="text-[0.7rem] font-medium text-neutral-500"
        >
          Description
        </label>
        <ProfileDescriptionEditor
          id="guest-profile-description"
          value={state.summary.summary}
          onChange={(summary) =>
            setState((s) => ({ ...s, summary: { ...s.summary, summary } }))
          }
          loginHref={loginHref}
        />
        <p className="text-[0.7rem] text-neutral-500">
          3–5 sentences: strengths, scope, and what you are looking for next.
        </p>
      </div>
      {jobAssist ? (
        <div className="space-y-4 border-t border-neutral-200 pt-4">
          <SummaryAiPanel projectId={jobAssist.projectId} state={state} setState={setState} />
          <SummaryJobTailorSection
            projectId={jobAssist.projectId}
            state={state}
            setState={setState}
            hasSavedJobTarget={jobAssist.hasSavedJobTarget}
            tailoringCompare={jobAssist.tailoringCompare}
            setTailoringCompare={jobAssist.setTailoringCompare}
          />
        </div>
      ) : null}
    </div>
  );
}

function ExperienceBody({
  state,
  setState,
  jobAssist,
}: {
  state: WizardStateV1;
  setState: Setter;
  jobAssist?: StudioJobAssistProps;
}) {
  const entries = state.experience.entries;
  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={entry.title || entry.company || "New position"}
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
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border border-input accent-brand"
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
              <Textarea
                key={`${entry.id}-h-${hi}`}
                className="min-h-[4rem]"
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
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
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
              Add bullet
            </Button>
          </div>
          {jobAssist ? (
            <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4">
              <ExperienceEntryAiPanel
                projectId={jobAssist.projectId}
                entry={entry}
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
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        onClick={() =>
          setState((s) => ({
            ...s,
            experience: {
              entries: [
                ...s.experience.entries,
                {
                  id: ensureEntryId(undefined),
                  company: "",
                  title: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  highlights: [""],
                },
              ],
            },
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add position
      </Button>
    </div>
  );
}

function EducationBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  const entries = state.education.entries;
  return (
    <div className="space-y-3">
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
        </EntryCard>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        onClick={() =>
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
          }))
        }
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
}: {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (lines: string) => void;
}) {
  return (
    <Field id={id} label={label} description={description}>
      <Textarea
        className="min-h-[10rem]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function SkillsBody({
  state,
  setState,
  jobAssist,
}: {
  state: WizardStateV1;
  setState: Setter;
  jobAssist?: StudioJobAssistProps;
}) {
  return (
    <div className="space-y-4">
      <Field
        id="skills"
        label="Skills"
        description="One skill per line. Keep it focused — 8–12 top skills usually read best."
      >
        <Textarea
          className="min-h-[10rem]"
          value={state.skills.lines}
          onChange={(e) => setState((s) => ({ ...s, skills: { lines: e.target.value } }))}
          placeholder={"TypeScript\nReact\nProduct strategy\nDesign systems"}
        />
      </Field>
      {jobAssist ? (
        <div className="space-y-4 border-t border-neutral-200 pt-4">
          <SkillsAiPanel
            projectId={jobAssist.projectId}
            lines={state.skills.lines}
            onApplyLines={(lines) => setState((s) => ({ ...s, skills: { lines } }))}
          />
          <SkillsJobTailorSection
            projectId={jobAssist.projectId}
            lines={state.skills.lines}
            setLines={(lines) => setState((s) => ({ ...s, skills: { lines } }))}
            hasSavedJobTarget={jobAssist.hasSavedJobTarget}
            tailoringCompare={jobAssist.tailoringCompare}
            setTailoringCompare={jobAssist.setTailoringCompare}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProjectsBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  const entries = state.projects.entries;
  return (
    <div className="space-y-3">
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
              className="min-h-[5rem]"
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
        className="w-full justify-center"
        onClick={() =>
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
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add project
      </Button>
    </div>
  );
}

function CertificationsBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  const entries = state.certifications.entries;
  return (
    <div className="space-y-3">
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
        className="w-full justify-center"
        onClick={() =>
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
          }))
        }
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
  jobAssist,
}: {
  state: WizardStateV1;
  setState: Setter;
  jobAssist?: StudioJobAssistProps;
}) {
  return (
    <div className="space-y-4">
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
      {jobAssist ? (
        <div className="border-t border-neutral-200 pt-4">
          <AdditionalAiPanel
            projectId={jobAssist.projectId}
            text={state.additional.notes}
            onApply={(text) => setState((s) => ({ ...s, additional: { notes: text } }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function EntryCard({
  title,
  subtitle,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string | null;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-white p-3 sm:p-4">
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
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
