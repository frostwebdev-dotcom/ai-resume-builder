"use client";

import Link from "next/link";
import {
  useCallback,
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
  Check,
  ChevronDown,
  ChevronUp,
  FileUp,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Trash2,
  ZoomOut,
} from "lucide-react";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { useGuestWizardAutosave } from "@/hooks/use-guest-wizard-autosave";
import type { SaveStatus } from "@/hooks/use-wizard-autosave";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { ensureEntryId } from "@/lib/resume-wizard/ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

type SectionId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "additional";

type SectionDef = {
  id: SectionId;
  label: string;
  hint?: string;
};

const SECTIONS: SectionDef[] = [
  { id: "personal", label: "Personal details" },
  { id: "summary", label: "Professional summary" },
  { id: "experience", label: "Employment history" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certifications", label: "Certifications" },
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

type StudioEditorProps = {
  content: WizardStateV1;
  onContentChange: Dispatch<SetStateAction<WizardStateV1>>;
  templateSlug: TemplateSlug;
  onTemplateChange: (slug: TemplateSlug) => void;
  resumeStyle: ResumeStyleV1;
  onResumeStyleChange: Dispatch<SetStateAction<ResumeStyleV1>>;
  loginHref: string;
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
}: StudioEditorProps) {
  const state = content;
  const setState = onContentChange;

  const { saveStatus, lastError, retry } = useGuestWizardAutosave({
    state,
    enabled: true,
  });

  const previewDocument = useMemo(
    () => mapWizardToPreviewDocument(state, { avatarUrl: null }),
    [state],
  );

  // Only one section is expanded at a time — keeps the left panel calm and focused.
  const [openSection, setOpenSection] = useState<SectionId | null>("personal");

  const toggleSection = useCallback((id: SectionId) => {
    setOpenSection((cur) => (cur === id ? null : id));
  }, []);

  // Mobile-only: editor is shown by default; preview is reachable via a toggle
  // so the entire screen never needs to scroll beyond the viewport.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Bottom preview toolbar state.
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  /** Fit-to-panel (no inner scroll) until user clicks the preview, then 1:1 + scroll. */
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const previewFitBodyRef = useRef<HTMLDivElement | null>(null);
  const previewMeasureRef = useRef<HTMLDivElement | null>(null);

  const currentSize =
    SIZE_PRESETS.find((p) => Math.abs((resumeStyle.lineHeight ?? 1.45) - p.lineHeight) < 0.02) ??
    SIZE_PRESETS[1];
  const currentSpacing =
    SPACING_PRESETS.find((p) => Math.abs((resumeStyle.sectionGapScale ?? 1) - p.scale) < 0.02) ??
    SPACING_PRESETS[1];
  const currentFont = FONT_PRESETS.find((p) => p.id === (resumeStyle.fontFamily ?? "sans"))
    ?? FONT_PRESETS[0];
  const currentColor = resumeStyle.accent ?? COLOR_SWATCHES[0];
  const templateName = getTemplateTheme(templateSlug).name;

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
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [fontOpen, sizeOpen, spacingOpen, colorOpen, templatesOpen]);

  useLayoutEffect(() => {
    if (previewZoomed) {
      setFitScale(1);
      return;
    }
    const container = previewFitBodyRef.current;
    const content = previewMeasureRef.current;
    if (!container || !content) return;

    const measure = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const mw = content.offsetWidth;
      const mh = content.offsetHeight;
      if (mw <= 0 || mh <= 0 || cw <= 0 || ch <= 0) return;
      const s = Math.min(cw / mw, ch / mh, 1);
      setFitScale((prev) => (Math.abs(prev - s) > 0.001 ? s : prev));
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [previewZoomed, previewDocument, templateSlug, resumeStyle]);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      {/* Left: editor */}
      <div
        className={cn(
          "min-h-0 overflow-y-auto border-border/70 bg-white lg:border-r",
          // On mobile the preview is a separate toggle-able pane — show
          // the editor full height by default so there's no outer scroll.
          focusMode ? "hidden" : "block",
          mobilePreviewOpen ? "hidden lg:block" : "",
        )}
      >
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <SaveBadge status={saveStatus} error={lastError} onRetry={retry} />

          <IntakeShortcuts />

          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              open={openSection === section.id}
              onToggle={() => toggleSection(section.id)}
              filled={isSectionFilled(section.id, state)}
            >
              <SectionBody section={section.id} state={state} setState={setState} />
            </SectionCard>
          ))}

          <p className="pt-4 pb-10 text-center text-xs text-muted-foreground">
            Saved to this device only.{" "}
            <Link
              href={loginHref}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{" "}
            to save to your account and download PDFs.
          </p>
        </div>
      </div>

      {/* Right: preview */}
      <div
        className={cn(
          "relative flex min-h-0 flex-col bg-slate-100/70",
          focusMode ? "col-span-full" : "",
          // On mobile, show only when the user taps the preview toggle.
          !mobilePreviewOpen && !focusMode ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-28 pt-3 sm:px-5 sm:pt-4">
          {/* Floating controls — not part of the template; keeps the canvas = one real sheet */}
          <div className="pointer-events-none absolute right-4 top-4 z-20 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 sm:right-6 sm:top-5">
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
            {/* Fit = no scroll; zoomed = scroll inside this region only */}
            <div
              ref={previewFitBodyRef}
              className={cn(
                "relative min-h-0 flex-1",
                previewZoomed
                  ? "cursor-default overflow-y-auto overflow-x-auto px-1 pt-10 sm:px-2"
                  : "cursor-zoom-in overflow-hidden px-1 pt-10 sm:px-2",
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
              <div
                ref={previewMeasureRef}
                style={
                  !previewZoomed
                    ? {
                        transform: `scale(${fitScale})`,
                        transformOrigin: "top center",
                      }
                    : undefined
                }
                className={cn("inline-block min-w-0 max-w-full", !previewZoomed && "will-change-transform")}
              >
                <PreviewViewport
                  presentation="document"
                  clipCanvas={!previewZoomed}
                >
                  <ResumePreviewRenderer
                    document={previewDocument}
                    templateSlug={templateSlug}
                    resumeStyle={resumeStyle}
                  />
                </PreviewViewport>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom preview toolbar */}
        <div
          ref={toolbarRef}
          className="sticky bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-white/95 px-2 py-2 backdrop-blur-md sm:px-4"
        >
          <div className="mx-auto flex max-w-[780px] items-center justify-between gap-2">
            {/* Templates */}
            <ToolbarButton
              active={templatesOpen}
              onClick={() => {
                setTemplatesOpen((v) => !v);
                setFontOpen(false);
                setSizeOpen(false);
                setSpacingOpen(false);
                setColorOpen(false);
              }}
              ariaLabel="Pick a template"
            >
              <span className="inline-flex size-4 items-center justify-center rounded-sm border border-current/70">
                <span className="size-2 rounded-[1px] bg-current/70" />
              </span>
              <span className="hidden sm:inline">Templates</span>
              <ChevronUp className={cn("size-3.5 transition-transform", templatesOpen && "rotate-180")} aria-hidden />
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

          {/* Popovers */}
          {templatesOpen ? (
            <Popover title="Templates" onClose={() => setTemplatesOpen(false)} align="start">
              <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">
                {TEMPLATE_SLUG_ORDER.map((slug) => {
                  const theme = getTemplateTheme(slug);
                  const selected = slug === templateSlug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => {
                        onTemplateChange(slug);
                        setTemplatesOpen(false);
                      }}
                      className={cn(
                        "group flex flex-col items-start gap-1 rounded-lg border bg-white p-2 text-left transition-colors",
                        selected
                          ? "border-brand ring-2 ring-brand/30"
                          : "border-border/70 hover:border-brand/60",
                      )}
                    >
                      <div
                        className="flex h-16 w-full flex-col gap-1 rounded bg-slate-50 p-1.5"
                        style={{ borderLeft: `3px solid ${theme.accent}` }}
                      >
                        <span
                          className="h-1.5 w-2/3 rounded"
                          style={{ background: theme.accent }}
                        />
                        <span className="h-1 w-5/6 rounded bg-slate-300" />
                        <span className="h-1 w-4/6 rounded bg-slate-200" />
                        <span className="h-1 w-3/4 rounded bg-slate-200" />
                      </div>
                      <span className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
                        <span className="truncate capitalize">{theme.name}</span>
                        {selected ? <Check className="size-3.5 text-brand" aria-hidden /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Popover>
          ) : null}

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
      </div>

      {/* Mobile-only floating toggle: swap between the editor and the preview
          without spawning any outer page scroll. Hidden on lg+ where the split
          layout shows both at once. */}
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
    </div>
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
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors sm:text-sm",
        active
          ? "bg-slate-900/5 text-slate-900"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
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
  open,
  onToggle,
  filled,
  children,
}: {
  section: SectionDef;
  open: boolean;
  onToggle: () => void;
  filled: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-shadow",
        open ? "border-border/80 shadow-sm" : "border-border/60 hover:border-border/80",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground">
          {section.label}
          {filled ? (
            <span
              className="inline-flex size-1.5 rounded-full bg-success"
              aria-label="Has content"
            />
          ) : null}
        </span>
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full border transition-all",
            open
              ? "border-brand/60 bg-brand-muted text-brand"
              : "border-border/70 bg-white text-muted-foreground",
          )}
          aria-hidden
        >
          {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border/70 px-4 pb-5 pt-4">{children}</div>
      ) : null}
    </section>
  );
}

function isSectionFilled(id: SectionId, s: WizardStateV1): boolean {
  switch (id) {
    case "personal":
      return Boolean(s.personal.fullName.trim() || s.personal.email.trim());
    case "summary":
      return Boolean(s.summary.headline.trim() || s.summary.summary.trim());
    case "experience":
      return s.experience.entries.some((e) => e.title.trim() || e.company.trim());
    case "education":
      return s.education.entries.some((e) => e.school.trim() || e.degree.trim());
    case "skills":
      return s.skills.lines.trim().length > 0;
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
}: {
  section: SectionId;
  state: WizardStateV1;
  setState: Dispatch<SetStateAction<WizardStateV1>>;
}) {
  switch (section) {
    case "personal":
      return <PersonalBody state={state} setState={setState} />;
    case "summary":
      return <SummaryBody state={state} setState={setState} />;
    case "experience":
      return <ExperienceBody state={state} setState={setState} />;
    case "education":
      return <EducationBody state={state} setState={setState} />;
    case "skills":
      return <SkillsBody state={state} setState={setState} />;
    case "projects":
      return <ProjectsBody state={state} setState={setState} />;
    case "certifications":
      return <CertificationsBody state={state} setState={setState} />;
    case "additional":
      return <AdditionalBody state={state} setState={setState} />;
    default:
      return null;
  }
}

type Setter = Dispatch<SetStateAction<WizardStateV1>>;

function PersonalBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  const p = state.personal;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="fullName" label="Full name" required>
        <Input
          name="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          value={p.fullName}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, fullName: e.target.value } }))
          }
        />
      </Field>
      <Field id="email" label="Email" required>
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={p.email}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, email: e.target.value } }))
          }
        />
      </Field>
      <Field id="phone" label="Phone">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 0100"
          value={p.phone}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, phone: e.target.value } }))
          }
        />
      </Field>
      <Field id="location" label="Location">
        <Input
          name="location"
          placeholder="Berlin, DE · Remote"
          value={p.location}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, location: e.target.value } }))
          }
        />
      </Field>
      <Field id="linkedIn" label="LinkedIn">
        <Input
          name="linkedIn"
          inputMode="url"
          placeholder="linkedin.com/in/your-name"
          value={p.linkedIn}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, linkedIn: e.target.value } }))
          }
        />
      </Field>
      <Field id="website" label="Website">
        <Input
          name="website"
          inputMode="url"
          placeholder="example.com"
          value={p.website}
          onChange={(e) =>
            setState((s) => ({ ...s, personal: { ...s.personal, website: e.target.value } }))
          }
        />
      </Field>
    </div>
  );
}

function SummaryBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  return (
    <div className="space-y-4">
      <Field id="headline" label="Headline">
        <Input
          placeholder="Product designer · Design systems · B2B SaaS"
          value={state.summary.headline}
          onChange={(e) =>
            setState((s) => ({ ...s, summary: { ...s.summary, headline: e.target.value } }))
          }
        />
      </Field>
      <Field
        id="summary"
        label="Professional summary"
        description="3–5 sentences: strengths, scope, and what you're looking for next."
      >
        <Textarea
          className="min-h-[8rem]"
          placeholder="Write in first person. Focus on outcomes and scope — not buzzwords."
          value={state.summary.summary}
          onChange={(e) =>
            setState((s) => ({ ...s, summary: { ...s.summary, summary: e.target.value } }))
          }
        />
      </Field>
    </div>
  );
}

function ExperienceBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
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
            <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Highlights
            </p>
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

function SkillsBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  return (
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

function AdditionalBody({ state, setState }: { state: WizardStateV1; setState: Setter }) {
  return (
    <Field
      id="additional"
      label="Additional information"
      description="Languages, interests, volunteer work — anything that adds context."
    >
      <Textarea
        className="min-h-[8rem]"
        value={state.additional.notes}
        onChange={(e) => setState((s) => ({ ...s, additional: { notes: e.target.value } }))}
        placeholder={"Languages: English (native), Spanish (B2)\nVolunteer: Code mentor at …"}
      />
    </Field>
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
