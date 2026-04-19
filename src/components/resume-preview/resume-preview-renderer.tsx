import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { ThemedTemplate } from "@/components/resume-preview/templates/themed-template";

type Props = {
  document: ResumePreviewDocument;
  templateSlug: TemplateSlug;
};

export function ResumePreviewRenderer({ document, templateSlug }: Props) {
  return <ThemedTemplate doc={document} slug={templateSlug} />;
}
