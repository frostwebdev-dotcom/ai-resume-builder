import { isProfileDescriptionEmpty } from "@/lib/profile-description-html";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasLineBlock(value: string | null | undefined): boolean {
  return Boolean(value?.split("\n").some((line) => line.trim()));
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
