import { isProfileDescriptionEmpty } from "@/lib/profile-description-html";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasLineBlock(value: string | null | undefined): boolean {
  return Boolean(value?.split("\n").some((line) => line.trim()));
}

function normalizedText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

const PLACEHOLDER_VALUES = new Set([
  "untitled resume",
  "professional headline",
  "headline",
  "job title",
  "your name",
  "first last",
  "resume draft",
  "company name",
  "school name",
  "project name",
  "worked on website and fixed bugs",
]);

function hasMeaningfulText(value: string | null | undefined, minLength = 2): boolean {
  const normalized = normalizedText(value);
  if (normalized.length < minLength) return false;
  if (PLACEHOLDER_VALUES.has(normalized)) return false;
  if (normalized.startsWith("e.g.")) return false;
  if (/^lorem ipsum\b/.test(normalized)) return false;
  return true;
}

function lineItems(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => hasMeaningfulText(line));
}

export function getCandidateDisplayName(state: WizardStateV1): string {
  const direct = state.personal.fullName.trim();
  if (direct) return direct;
  return [state.personal.givenName, state.personal.middleName, state.personal.familyName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function hasGuestIdentifyingContent(state: WizardStateV1): boolean {
  const p = state.personal;
  return Boolean(
    getCandidateDisplayName(state) ||
      hasText(p.desiredJobPosition) ||
      hasText(p.email) ||
      hasText(p.phone) ||
      hasText(p.location) ||
      hasText(p.city) ||
      hasText(p.linkedIn) ||
      hasText(p.website),
  );
}

export function hasGuestMeaningfulSection(state: WizardStateV1): boolean {
  return Boolean(
    hasText(state.summary.headline) ||
      !isProfileDescriptionEmpty(state.summary.summary) ||
      state.experience.entries.some((entry) =>
        [entry.company, entry.title, entry.location, entry.startDate, entry.endDate, ...entry.highlights].some(hasText),
      ) ||
      state.education.entries.some((entry) =>
        [entry.school, entry.degree, entry.field, entry.startDate, entry.endDate, entry.details].some(hasText),
      ) ||
      hasLineBlock(state.skills.lines) ||
      hasLineBlock(state.languages.lines) ||
      hasLineBlock(state.hobbies.lines) ||
      hasLineBlock(state.courses.lines) ||
      hasLineBlock(state.internships.lines) ||
      state.certifications.entries.some((entry) =>
        [entry.name, entry.issuer, entry.issued, entry.expires].some(hasText),
      ) ||
      state.projects.entries.some((entry) =>
        [entry.name, entry.url, entry.description, entry.technologies].some(hasText),
      ) ||
      hasText(state.additional.notes),
  );
}

export function hasMeaningfulGuestResumeContent(state: WizardStateV1): boolean {
  return hasGuestIdentifyingContent(state) || hasGuestMeaningfulSection(state);
}

export function hasPreviewReadyResumeContent(state: WizardStateV1): boolean {
  return hasGuestIdentifyingContent(state) && hasGuestMeaningfulSection(state);
}

export type ResumeReadinessStatus = "empty" | "started" | "incomplete" | "ready_for_export";

export type ResumeReadiness = {
  status: ResumeReadinessStatus;
  missingItems: string[];
  recommendedItems: string[];
  isExportReady: boolean;
};

export function getResumeReadiness(state: WizardStateV1): ResumeReadiness {
  const p = state.personal;
  const candidateName = getCandidateDisplayName(state);
  const hasCandidateName = hasMeaningfulText(candidateName);
  const hasContact = [
    p.email,
    p.phone,
    p.city,
    p.location,
    p.linkedIn,
    p.website,
  ].some((value) => hasMeaningfulText(value));
  const headline = p.useJobPositionAsHeadline
    ? p.desiredJobPosition
    : state.summary.headline || p.desiredJobPosition;
  const hasHeadline = hasMeaningfulText(headline, 4);

  const meaningfulExperience = state.experience.entries.some((entry) => {
    const title = hasMeaningfulText(entry.title);
    const company = hasMeaningfulText(entry.company);
    const strongHighlight = entry.highlights.some((line) => hasMeaningfulText(line, 18));
    return (title && company) || strongHighlight;
  });
  const meaningfulEducation = state.education.entries.some((entry) =>
    [entry.school, entry.degree, entry.field, entry.details].some((value) =>
      hasMeaningfulText(value, 3),
    ),
  );
  const meaningfulProjects = state.projects.entries.some((entry) =>
    hasMeaningfulText(entry.name, 3) &&
    (hasMeaningfulText(entry.description, 12) || hasMeaningfulText(entry.technologies, 3)),
  );
  const meaningfulSkills = lineItems(state.skills.lines).length >= 3;
  const hasCoreSection =
    meaningfulExperience || meaningfulEducation || meaningfulProjects || meaningfulSkills;

  const missingItems: string[] = [];
  if (!hasCandidateName) missingItems.push("Add your name");
  if (!hasContact) missingItems.push("Add one contact method");
  if (!hasHeadline) missingItems.push("Add your professional headline");
  if (!hasCoreSection) missingItems.push("Add work experience, education, a project, or skills");

  const recommendedItems: string[] = [];
  const hasWeakExperience = state.experience.entries.some((entry) => {
    const touched = [entry.title, entry.company, entry.location, entry.startDate, entry.endDate, ...entry.highlights]
      .some(hasText);
    if (!touched) return false;
    return !(
      hasMeaningfulText(entry.title) &&
      hasMeaningfulText(entry.company) &&
      entry.highlights.some((line) => hasMeaningfulText(line, 18))
    );
  });
  if (hasWeakExperience) recommendedItems.push("Review incomplete work experience entries");

  const hasWeakEducation = state.education.entries.some((entry) => {
    const touched = [entry.school, entry.degree, entry.field, entry.startDate, entry.endDate, entry.details]
      .some(hasText);
    if (!touched) return false;
    return ![entry.school, entry.degree, entry.field].some((value) => hasMeaningfulText(value, 3));
  });
  if (hasWeakEducation) recommendedItems.push("Review incomplete education entries");

  if (hasLineBlock(state.courses.lines) && lineItems(state.courses.lines).length === 0) {
    recommendedItems.push("Review incomplete courses section");
  }

  const hasAnyContent =
    hasMeaningfulGuestResumeContent(state) ||
    hasCandidateName ||
    hasContact ||
    hasHeadline ||
    hasCoreSection;
  const isExportReady = missingItems.length === 0;
  const status: ResumeReadinessStatus = !hasAnyContent
    ? "empty"
    : isExportReady
      ? "ready_for_export"
      : missingItems.length >= 3
        ? "started"
        : "incomplete";

  return {
    status,
    missingItems,
    recommendedItems,
    isExportReady,
  };
}
