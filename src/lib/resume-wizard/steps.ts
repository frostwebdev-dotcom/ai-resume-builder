export type WizardStepId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "additional";

export const WIZARD_STEPS: { id: WizardStepId; label: string; short: string }[] = [
  { id: "personal", label: "Personal details", short: "Personal" },
  { id: "summary", label: "Professional summary", short: "Summary" },
  { id: "experience", label: "Work experience", short: "Work" },
  { id: "education", label: "Education", short: "Education" },
  { id: "skills", label: "Skills", short: "Skills" },
  { id: "certifications", label: "Certifications", short: "Certs" },
  { id: "projects", label: "Projects", short: "Projects" },
  { id: "additional", label: "Additional info", short: "Extra" },
];

export function stepIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}
