import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { ResumeTemplateRoot } from "@/components/resume-preview/resume-template-root";

type Props = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
  /** When set, the matching preview block is visually emphasized (e.g. open studio section). */
  studioFocusSection?: WizardEditorSectionId | null;
  className?: string;
};

/**
 * Public preview entry — delegates to {@link ResumeTemplateRoot} so PDF and UI
 * share one structural routing point.
 */
export function ResumePreviewRenderer({
  document,
  templateSlug,
  resumeStyle,
  studioFocusSection = null,
  className,
}: Props) {
  return (
    <ResumeTemplateRoot
      document={document}
      templateSlug={templateSlug}
      resumeStyle={resumeStyle}
      studioFocusSection={studioFocusSection}
      className={className}
    />
  );
}
