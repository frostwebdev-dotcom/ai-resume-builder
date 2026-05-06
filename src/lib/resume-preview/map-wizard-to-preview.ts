import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { isProfileDescriptionEmpty } from "@/lib/profile-description-html";
import { buildPageBreaksFromWizard } from "@/lib/resume-preview/page-breaks";

import {
  formatCertDate,
  formatEducationDateRange,
  formatExperienceDateRange,
} from "@/lib/resume-preview/format-dates";
import type {
  ResumePreviewBodyBlockId,
  ResumePreviewDocument,
  ResumeSupplementarySection,
} from "@/lib/resume-preview/model";
import { normalizeWizardSectionOrder } from "@/lib/resume-wizard/section-order";

function splitSkills(lines: string): string[] {
  return lines
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function composedFullName(p: WizardStateV1["personal"]): string {
  const split = [p.givenName, p.middleName, p.familyName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  return (split || p.fullName).trim();
}

function composedLocationLine(p: WizardStateV1["personal"]): string {
  const parts = [
    p.address.trim(),
    [p.postCode.trim(), p.city.trim()].filter(Boolean).join(" "),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return p.location.trim();
}

export function mapWizardToPreviewDocument(
  wizard: WizardStateV1,
  options?: { avatarUrl?: string | null },
): ResumePreviewDocument {
  const p = wizard.personal;
  const fullName = composedFullName(p);
  const fromJob = p.useJobPositionAsHeadline && p.desiredJobPosition.trim();
  const headline = (fromJob ? p.desiredJobPosition : wizard.summary.headline).trim();
  const summaryBody = wizard.summary.summary.trim();
  const summary = isProfileDescriptionEmpty(summaryBody) ? null : summaryBody;

  const placement = p.showNameIn ?? "title";
  const contactLines: ResumePreviewDocument["contact"]["lines"] = [];
  if (
    fullName &&
    (placement === "personal" || placement === "both")
  ) {
    contactLines.push({ label: "Name", value: fullName });
  }
  if (p.email.trim()) contactLines.push({ label: "Email", value: p.email.trim() });
  if (p.phone.trim()) contactLines.push({ label: "Phone", value: p.phone.trim() });
  const loc = composedLocationLine(p);
  if (loc) contactLines.push({ label: "Location", value: loc });
  else if (p.location.trim()) contactLines.push({ label: "Location", value: p.location.trim() });
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

  const bodySectionOrder = normalizeWizardSectionOrder(
    wizard.layout.sectionOrder,
  ).filter((id): id is ResumePreviewBodyBlockId => id !== "personal");

  const supplementarySections: ResumeSupplementarySection[] = [];
  const supLines: Record<
    ResumeSupplementarySection["id"],
    { title: string; lines: string | undefined }
  > = {
    languages: { title: "Languages", lines: wizard.languages?.lines },
    hobbies: { title: "Hobbies", lines: wizard.hobbies?.lines },
    courses: { title: "Courses", lines: wizard.courses?.lines },
    internships: { title: "Internships", lines: wizard.internships?.lines },
  };
  for (const id of bodySectionOrder) {
    if (id !== "languages" && id !== "hobbies" && id !== "courses" && id !== "internships") {
      continue;
    }
    const body = supLines[id].lines?.trim();
    if (body) supplementarySections.push({ id, title: supLines[id].title, body });
  }

  const additional = wizard.additional.notes.trim() || null;

  const personalOptionalLines: ResumePreviewDocument["personalOptionalLines"] = [];
  if (p.dateOfBirth.trim()) {
    personalOptionalLines.push({
      label: "Date of birth",
      value: p.dateOfBirth.trim(),
    });
  }
  if (p.placeOfBirth.trim()) {
    personalOptionalLines.push({
      label: "Place of birth",
      value: p.placeOfBirth.trim(),
    });
  }
  if (p.driversLicense.trim()) {
    personalOptionalLines.push({
      label: "Driver's license",
      value: p.driversLicense.trim(),
    });
  }
  if (p.gender.trim()) {
    personalOptionalLines.push({ label: "Gender", value: p.gender.trim() });
  }
  if (p.nationality.trim()) {
    personalOptionalLines.push({
      label: "Nationality",
      value: p.nationality.trim(),
    });
  }
  if (p.civilStatus.trim()) {
    personalOptionalLines.push({
      label: "Civil status",
      value: p.civilStatus.trim(),
    });
  }
  {
    const lab = p.customFieldLabel.trim();
    const val = p.customFieldValue.trim();
    if (lab || val) {
      const value =
        lab && val ? `${lab}: ${val}` : val || lab;
      personalOptionalLines.push({
        label: "Field name",
        value,
      });
    }
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
  if (personalOptionalLines.length) filledSections.push("personalOptional");
  if (additional) filledSections.push("additional");

  const pageBreakBefore = buildPageBreaksFromWizard(wizard);

  return {
    v: 1,
    identity: {
      fullName,
      headline,
      avatarUrl:
        options?.avatarUrl ??
        (p.photoDataUrl?.trim().startsWith("data:") ? p.photoDataUrl.trim() : null),
      namePlacement: placement,
    },
    contact: { lines: contactLines },
    personalOptionalLines,
    supplementarySections,
    bodySectionOrder,
    summary,
    skills,
    experience,
    education,
    certifications,
    projects,
    additional,
    ...(pageBreakBefore ? { pageBreakBefore } : {}),
    completeness: {
      hasName: Boolean(fullName),
      filledSections,
    },
  };
}
