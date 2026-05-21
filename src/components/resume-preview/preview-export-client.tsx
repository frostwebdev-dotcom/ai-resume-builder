"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  LayoutTemplate,
  Lock,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ResumeAiScoreCard } from "@/components/resume-preview/resume-ai-score-card";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumeDownloadSection } from "@/components/resume-preview/resume-download-section";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_SLUG,
  isTemplateSlug,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import { setProjectTemplateAction } from "@/services/projects/actions";
import type { ResumeDownloadAccess } from "@/services/downloads/queries";
import type { TemplateOption } from "@/services/templates/queries";
import { cn } from "@/lib/utils";

type MobileTab = "preview" | "review" | "template" | "export";
type PreviewZoom = "fit" | "75" | "100";

type Props = {
  projectId: string;
  projectTitle: string;
  document: ResumePreviewDocument;
  templates: TemplateOption[];
  selectedTemplateId: string | null;
  downloadAccess: ResumeDownloadAccess;
  checkoutEnabled: boolean;
  showPaymentSetupDetails: boolean;
  initialResumeStyle: ResumeStyleV1;
  checkoutNotice?: "success" | "failed" | "cancelled" | "pending" | null;
};

const tabs: Array<{ id: MobileTab; label: string }> = [
  { id: "preview", label: "Preview" },
  { id: "review", label: "Review" },
  { id: "template", label: "Template" },
  { id: "export", label: "Export" },
];

const previewZoomOptions: Array<{ value: PreviewZoom; label: string }> = [
  { value: "fit", label: "Fit" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
];

const recommendedTemplateMeta = {
  "professional-ats": {
    name: "Professional ATS",
    bestFor: "most roles",
    order: 0,
  },
  "modern-professional": {
    name: "Modern Professional",
    bestFor: "polished general use",
    order: 1,
  },
  "technical-clean": {
    name: "Technical Clean",
    bestFor: "developers and engineers",
    order: 2,
  },
  clio: {
    name: "Executive Classic",
    bestFor: "senior professionals",
    order: 3,
  },
} as const;

export function PreviewExportClient({
  projectId,
  projectTitle,
  document,
  templates,
  selectedTemplateId,
  downloadAccess,
  checkoutEnabled,
  showPaymentSetupDetails,
  initialResumeStyle,
  checkoutNotice = null,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<MobileTab>("preview");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState(selectedTemplateId ?? DEFAULT_TEMPLATE_ID);
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>("fit");

  const currentTemplate = templates.find((t) => t.id === currentTemplateId) ?? templates[0] ?? null;
  const currentSlug = currentTemplate && isTemplateSlug(currentTemplate.slug)
    ? currentTemplate.slug
    : templateIdToSlug(currentTemplateId);
  const templateMeta = templateCardMeta(currentSlug, currentTemplate);
  const orderedTemplates = orderTemplatesForPicker(templates);

  const selectTemplate = (templateId: string) => {
    if (templateId === currentTemplateId) {
      setTemplateModalOpen(false);
      return;
    }
    setTemplateError(null);
    const previous = currentTemplateId;
    setCurrentTemplateId(templateId);
    startTransition(async () => {
      const res = await setProjectTemplateAction({ projectId, templateId });
      if (!res.ok) {
        setCurrentTemplateId(previous);
        setTemplateError(res.error);
        return;
      }
      setTemplateModalOpen(false);
      router.refresh();
    });
  };

  const sectionClass = (tab: MobileTab) =>
    cn("min-w-0", activeTab === tab ? "block" : "hidden", "lg:block");

  return (
    <div className="min-w-0 space-y-5 pb-20 lg:pb-0">
      <header className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] ring-1 ring-slate-950/5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/15 bg-emerald-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              <ShieldCheck className="size-3.5" aria-hidden />
              Secure final review
            </div>
            <div className="space-y-2">
              <h1 className="text-balance text-display text-foreground">Resume Preview &amp; Export</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Review your resume and unlock your final PDF when ready.
              </p>
            </div>
            {projectTitle.trim() ? (
              <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <FileText className="size-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">
                  Project: <span className="font-medium text-foreground">{projectTitle}</span>
                </span>
              </div>
            ) : null}
          </div>
          <Link
            href={ROUTES.app.projectBuild(projectId)}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }), "w-full justify-center gap-2 bg-white/85 sm:w-auto")}
          >
            <NotebookPen className="size-4" aria-hidden />
            Back to editor
          </Link>
        </div>
      </header>

      <div className="sticky top-0 z-20 grid grid-cols-4 gap-2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-soft backdrop-blur lg:hidden" role="tablist" aria-label="Preview export sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors",
              activeTab === tab.id
                ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                : "border-border/70 bg-card text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(26rem,0.72fr)_minmax(0,1.28fr)] lg:items-start">
        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <section className={sectionClass("export")}>
            <StatusPanel
              templateName={templateMeta.name}
              canDownload={downloadAccess.canDownload}
            />
          </section>

          <section className={sectionClass("review")} id="ai-review-section" aria-label="AI Resume Review">
            <ResumeAiScoreCard
              projectId={projectId}
              variant="preview"
              resultMode="summary"
              className="rounded-2xl"
            />
          </section>

          <section
            className={cn(
              sectionClass("template"),
              "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5",
            )}
            aria-labelledby="template-panel-heading"
          >
            <div className="flex items-start gap-3 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white ring-1 ring-slate-950/10">
                <LayoutTemplate className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="template-panel-heading" className="text-subhead text-foreground">
                  Template Selection
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your content stays unchanged when you switch templates.
                </p>
              </div>
            </div>
            <div className="p-4">
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{templateMeta.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Best for {templateMeta.bestFor}.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-600/15">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  ATS-friendly
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="mt-4 w-full"
                onClick={() => setTemplateModalOpen(true)}
              >
                Change template
              </Button>
              {templateError ? (
                <p className="mt-3 text-sm font-medium text-destructive" role="alert">
                  {templateError}
                </p>
              ) : null}
            </div>
            </div>
          </section>

          <section className={sectionClass("export")} id="export-section" aria-label="Export PDF">
            <ResumeDownloadSection
              projectId={projectId}
              canDownload={downloadAccess.canDownload}
              hasDownloadHistory={downloadAccess.hasDownloadHistory}
              checkoutEnabled={checkoutEnabled}
              showPaymentSetupDetails={showPaymentSetupDetails}
              checkoutNotice={checkoutNotice}
            />
          </section>
        </div>

        <aside
          className={cn(
            sectionClass("preview"),
            "order-1 min-w-0 lg:order-2 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-3xl lg:border lg:border-slate-200/90 lg:bg-white/80 lg:p-3 lg:shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] lg:ring-1 lg:ring-slate-950/5",
          )}
          aria-labelledby="preview-heading"
        >
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="preview-heading" className="text-subhead text-foreground">
                Preview
              </h2>
              <p className="text-caption text-muted-foreground">
                This preview matches your final PDF export.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Preview zoom">
              {previewZoomOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={previewZoom === option.value}
                  onClick={() => setPreviewZoom(option.value)}
                  className={cn(
                    "min-h-9 rounded-lg px-3 text-xs font-medium transition-colors",
                    previewZoom === option.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <PreviewViewport
            compactFrame
            clipCanvas
            className="overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-50 shadow-inner ring-1 ring-slate-200/80"
          >
            <div
              className="mx-auto flex justify-center"
              style={
                previewZoom === "fit"
                  ? undefined
                  : ({ zoom: previewZoom === "75" ? 0.75 : 1 } as CSSProperties)
              }
            >
              <ResumePreviewRenderer
                document={document}
                templateSlug={currentSlug}
                resumeStyle={initialResumeStyle}
              />
            </div>
          </PreviewViewport>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] z-30 px-3 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-elevated backdrop-blur">
          <Link
            href={ROUTES.app.projectBuild(projectId)}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }), "min-h-12 px-3 text-sm")}
          >
            <NotebookPen className="size-4" aria-hidden />
            Edit
          </Link>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary", size: "touch" }), "min-h-12 px-3 text-sm")}
            onClick={() => setActiveTab("review")}
          >
            <Sparkles className="size-4" aria-hidden />
            AI Review
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "default", size: "touch" }), "min-h-12 px-3 text-sm")}
            onClick={() => setActiveTab("export")}
          >
            <Download className="size-4" aria-hidden />
            PDF
          </button>
        </div>
      </div>

      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-h-[min(88dvh,44rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a template</DialogTitle>
            <DialogDescription>
              Pick a professional layout. Switching templates does not change your resume content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {orderedTemplates.map((template) => {
              const slug = isTemplateSlug(template.slug) ? template.slug : DEFAULT_TEMPLATE_SLUG;
              const meta = templateCardMeta(slug, template);
              const selected = template.id === currentTemplateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  disabled={pending}
                  onClick={() => selectTemplate(template.id)}
                  className={cn(
                    "flex min-h-32 flex-col rounded-xl border bg-card p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                    selected ? "border-brand/60 ring-2 ring-brand/20" : "border-border/70 hover:border-brand/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{meta.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Best for {meta.bestFor}.</p>
                    </div>
                    {selected ? (
                      <CheckCircle2 className="size-5 shrink-0 text-brand" aria-hidden />
                    ) : null}
                  </div>
                  <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-600/15">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    ATS-friendly
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPanel({ templateName, canDownload }: { templateName: string; canDownload: boolean }) {
  const rows = [
    { label: "Resume saved", detail: "Latest draft is ready for review.", done: true, Icon: CheckCircle2 },
    { label: "Template selected", detail: templateName, done: true, Icon: LayoutTemplate },
    { label: "AI review optional", detail: "Run a quality check before download.", done: true, Icon: Sparkles },
    {
      label: canDownload ? "PDF unlocked" : "PDF locked",
      detail: canDownload ? "Your final PDF can be downloaded." : "Unlock after checkout.",
      done: canDownload,
      Icon: canDownload ? CheckCircle2 : Lock,
    },
  ];
  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5"
      aria-labelledby="status-heading"
    >
      <div className="flex items-start gap-3 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white ring-1 ring-slate-950/10">
          <FileText className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="status-heading" className="text-subhead text-foreground">Resume Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">A final checklist before download.</p>
        </div>
      </div>
      <ul className="space-y-2 p-4">
        {rows.map(({ label, detail, done, Icon }) => (
          <li
            key={label}
            className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/75 px-3 py-3"
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", done ? "text-emerald-600" : "text-slate-500")}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{label}</span>
              <span className="block truncate text-xs text-slate-500">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function orderTemplatesForPicker(templates: TemplateOption[]): TemplateOption[] {
  return [...templates].sort((a, b) => {
    const aSlug = isTemplateSlug(a.slug) ? a.slug : DEFAULT_TEMPLATE_SLUG;
    const bSlug = isTemplateSlug(b.slug) ? b.slug : DEFAULT_TEMPLATE_SLUG;
    const aOrder = recommendedTemplateMeta[aSlug as keyof typeof recommendedTemplateMeta]?.order ?? 99;
    const bOrder = recommendedTemplateMeta[bSlug as keyof typeof recommendedTemplateMeta]?.order ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

function templateCardMeta(slug: TemplateSlug, template: TemplateOption | null) {
  const recommended = recommendedTemplateMeta[slug as keyof typeof recommendedTemplateMeta];
  if (recommended) return recommended;
  return {
    name: template?.name ?? "Professional template",
    bestFor: "clear, professional presentation",
  };
}
