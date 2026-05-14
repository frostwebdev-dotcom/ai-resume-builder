import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { SidebarTemplate } from "@/components/resume-preview/templates/sidebar-template";
import { ThemedTemplate } from "@/components/resume-preview/templates/themed-template";

export type ResumeTemplateRootProps = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
  studioFocusSection?: WizardEditorSectionId | null;
  /** Optional class on the outer article (e.g. thumbnail scaling). */
  className?: string;
};

/**
 * Single entry point for resume preview + PDF-facing structure.
 * Classic, sidebar, and photo-banner families are driven by `getTemplateTheme(slug)`.
 */
export function ResumeTemplateRoot({
  document,
  templateSlug,
  resumeStyle = null,
  studioFocusSection = null,
  className,
}: ResumeTemplateRootProps) {
  const theme = getTemplateTheme(templateSlug);

  if (theme.layoutFamily === "sidebar") {
    return (
      <SidebarTemplate
        doc={document}
        slug={templateSlug}
        resumeStyle={resumeStyle}
        studioFocusSection={studioFocusSection}
      />
    );
  }

  return (
    <ThemedTemplate
      doc={document}
      slug={templateSlug}
      resumeStyle={resumeStyle}
      className={className}
      studioFocusSection={studioFocusSection}
    />
  );
}
