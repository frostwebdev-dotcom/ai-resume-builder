import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { TemplateAthena } from "@/components/resume-preview/templates/template-athena";
import { TemplateMeridian } from "@/components/resume-preview/templates/template-meridian";
import { TemplateNova } from "@/components/resume-preview/templates/template-nova";

type Props = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
};

export function ResumePreviewRenderer({ document, templateSlug }: Props) {
  switch (templateSlug) {
    case "meridian":
      return <TemplateMeridian doc={document} />;
    case "nova":
      return <TemplateNova doc={document} />;
    case "athena":
    default:
      return <TemplateAthena doc={document} />;
  }
}
