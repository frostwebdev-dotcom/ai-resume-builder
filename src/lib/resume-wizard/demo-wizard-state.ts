import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import { buildDemoWizardStateForTemplateSlug } from "@/lib/resume-wizard/demo-template-personas";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

function parseDemo(raw: WizardStateV1): WizardStateV1 {
  const parsed = wizardStateSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[demo-wizard-state] schema drift", parsed.error.flatten());
    throw new Error("Demo wizard state failed validation; update demo-template-personas.ts.");
  }
  return parsed.data;
}

/**
 * Per-template fictional demo résumé (names, roles, skills, personal fields, experience, etc.).
 * Avatar-capable layouts use `getDemoAvatarUrlForTemplate` when mapping to preview.
 */
export function createDemoWizardStateForTemplate(slug: TemplateSlug): WizardStateV1 {
  return parseDemo(buildDemoWizardStateForTemplateSlug(slug));
}

/**
 * Default guest / legacy demo — uses the **Athena** template persona (first in catalog order).
 */
export function createDemoWizardState(): WizardStateV1 {
  return createDemoWizardStateForTemplate("athena");
}

export { getDemoAvatarUrlForTemplate } from "@/lib/resume-wizard/demo-template-personas";
