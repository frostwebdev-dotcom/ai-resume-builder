import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

/**
 * Visual tone for the focus ring: white inset on dark rails/banners, brand inset on white paper.
 */
export type StudioPreviewFocusTone = "paper" | "rail";

export function studioPreviewSectionDomProps(sectionId: WizardEditorSectionId): {
  "data-studio-section": WizardEditorSectionId;
  id: string;
} {
  return {
    "data-studio-section": sectionId,
    id: `preview-section-${sectionId}`,
  };
}

export function studioPreviewSectionClassName(
  sectionId: WizardEditorSectionId,
  studioFocusSection: WizardEditorSectionId | null | undefined,
  tone: StudioPreviewFocusTone,
  baseClass?: string,
): string {
  const active =
    studioFocusSection != null && studioFocusSection === sectionId;
  return cn(
    baseClass,
    "scroll-mt-6 rounded-sm motion-safe:transition-[box-shadow] motion-safe:duration-200 motion-safe:ease-out",
    active &&
      (tone === "paper"
        ? "relative z-[1] shadow-[inset_0_0_0_2px_rgb(34_104_215/0.5),0_0_0_1px_rgb(34_104_215/0.12)]"
        : "relative z-[1] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.55),0_0_0_1px_rgb(255_255_255/0.12)]"),
  );
}

export function mergeStudioPreviewSection(
  sectionId: WizardEditorSectionId,
  studioFocusSection: WizardEditorSectionId | null | undefined,
  tone: StudioPreviewFocusTone,
  className?: string,
): {
  "data-studio-section": WizardEditorSectionId;
  id: string;
  className: string;
} {
  return {
    ...studioPreviewSectionDomProps(sectionId),
    className: studioPreviewSectionClassName(sectionId, studioFocusSection, tone, className),
  };
}
