import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { SidebarTemplate } from "@/components/resume-preview/templates/sidebar-template";
import { ThemedTemplate } from "@/components/resume-preview/templates/themed-template";

type Props = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
};

/**
 * Routes to the correct structural template family. Visual styling (colors,
 * fonts, density, header variant) still derives from the shared theme so that
 * in-family customization remains consistent.
 */
export function ResumePreviewRenderer({ document, templateSlug, resumeStyle }: Props) {
  const theme = getTemplateTheme(templateSlug);

  if (theme.layoutFamily === "sidebar") {
    return <SidebarTemplate doc={document} slug={templateSlug} resumeStyle={resumeStyle} />;
  }

  return <ThemedTemplate doc={document} slug={templateSlug} resumeStyle={resumeStyle} />;
}
