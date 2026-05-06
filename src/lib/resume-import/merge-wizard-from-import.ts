import "server-only";

import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import { normalizeWizardSectionOrder } from "@/lib/resume-wizard/section-order";
import { ensureEntryId } from "@/lib/resume-wizard/ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import type { ResumeImportAiOutput } from "@/validation/resume-import";

/**
 * Applies AI import output onto a validated base skeleton (layout + empty sections).
 */
export function mergeWizardFromImport(base: WizardStateV1, patch: ResumeImportAiOutput): WizardStateV1 {
  const p = patch.personal;
  const given = p.givenName.trim();
  const middle = p.middleName.trim();
  const family = p.familyName.trim();
  const splitFull = [given, middle, family].filter(Boolean).join(" ").trim();
  let fullName = p.fullName.trim() || splitFull;
  let givenOut = given;
  let familyOut = family;
  if (!fullName.trim()) {
    givenOut = "Imported";
    familyOut = "Résumé";
    fullName = `${givenOut} ${familyOut}`.trim();
  }

  const next = {
    ...base,
    personal: {
      ...base.personal,
      ...p,
      fullName,
      givenName: givenOut,
      middleName: middle,
      familyName: familyOut,
      photoDataUrl: "",
      dateOfBirth: "",
      placeOfBirth: "",
      driversLicense: "",
      gender: "",
      nationality: "",
      civilStatus: "",
      customFields: [],
    },
    summary: {
      headline: patch.summary.headline.trim(),
      summary: patch.summary.summaryHtml.trim(),
    },
    experience: {
      entries: patch.experience.entries.map((e) => ({
        id: ensureEntryId(undefined),
        company: e.company.trim(),
        title: e.title.trim(),
        location: e.location.trim(),
        startDate: e.startDate.trim(),
        endDate: e.endDate.trim(),
        current: e.current,
        highlights: e.highlights.map((h) => h.trim()).filter(Boolean),
      })),
    },
    education: {
      entries: patch.education.entries.map((e) => ({
        id: ensureEntryId(undefined),
        school: e.school.trim(),
        degree: e.degree.trim(),
        field: e.field.trim(),
        startDate: e.startDate.trim(),
        endDate: e.endDate.trim(),
        current: e.current,
        details: e.details.trim(),
      })),
    },
    skills: { lines: patch.skills.lines.trim() },
    languages: { lines: patch.languages?.lines?.trim() ?? "" },
    hobbies: { lines: patch.hobbies?.lines?.trim() ?? "" },
    courses: { lines: patch.courses?.lines?.trim() ?? "" },
    internships: { lines: patch.internships?.lines?.trim() ?? "" },
    certifications: {
      entries: (patch.certifications?.entries ?? []).map((c) => ({
        id: ensureEntryId(undefined),
        name: c.name.trim(),
        issuer: c.issuer.trim(),
        issued: c.issued.trim(),
        expires: c.expires.trim(),
      })),
    },
    projects: {
      entries: (patch.projects?.entries ?? []).map((pr) => ({
        id: ensureEntryId(undefined),
        name: pr.name.trim(),
        url: pr.url.trim(),
        description: pr.description.trim(),
        technologies: pr.technologies.trim(),
      })),
    },
    additional: {
      notes: patch.additional?.notes?.trim() ?? "",
    },
    layout: {
      v: 1,
      pageBreakBefore: { ...base.layout.pageBreakBefore },
      sectionOrder: normalizeWizardSectionOrder(base.layout.sectionOrder),
    },
  };

  const safe = wizardStateSchema.safeParse(next);
  if (!safe.success) {
    console.error("[resume-import] merged state failed schema", safe.error.flatten());
    throw new Error("IMPORT_SCHEMA");
  }
  return safe.data as WizardStateV1;
}
