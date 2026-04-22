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
  { id: "summary", label: "Profile", short: "Profile" },
  { id: "experience", label: "Employment", short: "Work" },
  { id: "education", label: "Education", short: "Education" },
  { id: "skills", label: "Skills", short: "Skills" },
  { id: "certifications", label: "Certificates", short: "Certs" },
  { id: "projects", label: "Projects", short: "Projects" },
  { id: "additional", label: "Additional information", short: "More" },
];

export function stepIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}
