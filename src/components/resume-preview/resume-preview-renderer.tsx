import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { SidebarTemplate } from "@/components/resume-preview/templates/sidebar-template";
import { ThemedTemplate } from "@/components/resume-preview/templates/themed-template";

type Props = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
  /** When set, the matching preview block is visually emphasized (e.g. open studio section). */
  studioFocusSection?: WizardEditorSectionId | null;
};

/**
 * Routes to the correct structural template family. Visual styling (colors,
 * fonts, density, header variant) still derives from the shared theme so that
 * in-family customization remains consistent.
 */
export function ResumePreviewRenderer({
  document,
  templateSlug,
  resumeStyle,
  studioFocusSection = null,
}: Props) {
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
      studioFocusSection={studioFocusSection}
    />
  );
}
