import type { WizardStateV1 } from "@/lib/resume-wizard/types";

import {
  formatCertDate,
  formatEducationDateRange,
  formatExperienceDateRange,
} from "@/lib/resume-preview/format-dates";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";

function splitSkills(lines: string): string[] {
  return lines
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mapWizardToPreviewDocument(
  wizard: WizardStateV1,
  options?: { avatarUrl?: string | null },
): ResumePreviewDocument {
  const p = wizard.personal;
  const fullName = p.fullName.trim();
  const headline = wizard.summary.headline.trim();
  const summary = wizard.summary.summary.trim() || null;

  const contactLines: ResumePreviewDocument["contact"]["lines"] = [];
  if (p.email.trim()) contactLines.push({ label: "Email", value: p.email.trim() });
  if (p.phone.trim()) contactLines.push({ label: "Phone", value: p.phone.trim() });
  if (p.location.trim()) contactLines.push({ label: "Location", value: p.location.trim() });
  if (p.linkedIn.trim()) contactLines.push({ label: "LinkedIn", value: p.linkedIn.trim() });
  if (p.website.trim()) contactLines.push({ label: "Web", value: p.website.trim() });

  const skills = splitSkills(wizard.skills.lines);

  const experience = wizard.experience.entries.map((e) => ({
    id: e.id,
    title: e.title.trim(),
    company: e.company.trim(),
    location: e.location.trim(),
    dateRange: formatExperienceDateRange(e.startDate, e.endDate, e.current),
    highlights: e.highlights.map((h) => h.trim()).filter(Boolean),
  }));

  const education = wizard.education.entries.map((e) => {
    const degreeParts = [e.degree.trim(), e.field.trim()].filter(Boolean);
    return {
      id: e.id,
      school: e.school.trim(),
      degreeLine: degreeParts.join(", ") || "Education",
      dateRange: formatEducationDateRange(e.startDate, e.endDate, e.current),
      details: e.details.trim() || null,
    };
  });

  const certifications = wizard.certifications.entries.map((c) => ({
    id: c.id,
    name: c.name.trim(),
    issuer: c.issuer.trim(),
    dateLine: formatCertDate(c.issued, c.expires),
  }));

  const projects = wizard.projects.entries.map((p) => ({
    id: p.id,
    name: p.name.trim(),
    url: p.url.trim() || null,
    description: p.description.trim(),
    technologies: p.technologies.trim(),
  }));

  const appendOptionalLines = (
    label: string,
    lines: string | undefined,
  ): string | null => {
    const t = lines?.trim();
    return t ? `${label}\n${t}` : null;
  };

  const extraBlocks = [
    appendOptionalLines("Languages", wizard.languages?.lines),
    appendOptionalLines("Hobbies", wizard.hobbies?.lines),
    appendOptionalLines("Courses", wizard.courses?.lines),
    appendOptionalLines("Internships", wizard.internships?.lines),
  ].filter((x): x is string => Boolean(x));

  let additional = wizard.additional.notes.trim() || null;
  if (extraBlocks.length) {
    const merged = [additional, ...extraBlocks].filter(Boolean).join("\n\n");
    additional = merged.length ? merged : null;
  }

  const filledSections: string[] = [];
  if (fullName) filledSections.push("name");
  if (headline) filledSections.push("headline");
  if (summary) filledSections.push("summary");
  if (skills.length) filledSections.push("skills");
  if (experience.some((x) => x.title || x.company || x.highlights.length)) {
    filledSections.push("experience");
  }
  if (education.some((x) => x.school || x.degreeLine !== "Education")) {
    filledSections.push("education");
  }
  if (certifications.some((x) => x.name || x.issuer)) filledSections.push("certifications");
  if (projects.some((x) => x.name || x.description)) filledSections.push("projects");
  if (wizard.languages?.lines?.trim()) filledSections.push("languages");
  if (wizard.hobbies?.lines?.trim()) filledSections.push("hobbies");
  if (wizard.courses?.lines?.trim()) filledSections.push("courses");
  if (wizard.internships?.lines?.trim()) filledSections.push("internships");
  if (additional) filledSections.push("additional");

  return {
    v: 1,
    identity: {
      fullName,
      headline,
      avatarUrl: options?.avatarUrl ?? null,
    },
    contact: { lines: contactLines },
    summary,
    skills,
    experience,
    education,
    certifications,
    projects,
    additional,
    completeness: {
      hasName: Boolean(fullName),
      filledSections,
    },
  };
}
