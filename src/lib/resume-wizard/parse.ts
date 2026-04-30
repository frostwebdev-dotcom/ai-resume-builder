import { createEmptyWizardState } from "@/lib/resume-wizard/defaults";
import { ensureEntryId } from "@/lib/resume-wizard/ids";
import { normalizeWizardSectionOrder } from "@/lib/resume-wizard/section-order";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import type {
  CertificationEntry,
  EducationEntry,
  ProjectEntry,
  WorkExperienceEntry,
  WizardStateV1,
} from "@/lib/resume-wizard/types";

/**
 * Merge stored JSON with defaults and validate. Falls back to a fresh wizard on error.
 */
export function hydrateWizardState(raw: unknown): WizardStateV1 {
  const defaults = createEmptyWizardState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }
  const o = raw as Record<string, unknown>;

  const merged: WizardStateV1 = {
    v: 1,
    personal: {
      ...defaults.personal,
      ...(typeof o.personal === "object" && o.personal !== null
        ? (o.personal as WizardStateV1["personal"])
        : {}),
    },
    summary: {
      ...defaults.summary,
      ...(typeof o.summary === "object" && o.summary !== null
        ? (o.summary as WizardStateV1["summary"])
        : {}),
    },
    experience: {
      entries: normalizeExperienceEntries(
        (o.experience as WizardStateV1["experience"] | undefined)?.entries,
        defaults.experience.entries,
      ),
    },
    education: {
      entries: normalizeEducationEntries(
        (o.education as WizardStateV1["education"] | undefined)?.entries,
        defaults.education.entries,
      ),
    },
    skills: {
      ...defaults.skills,
      ...(typeof o.skills === "object" && o.skills !== null
        ? (o.skills as WizardStateV1["skills"])
        : {}),
    },
    languages: {
      ...defaults.languages,
      ...(typeof o.languages === "object" && o.languages !== null
        ? (o.languages as WizardStateV1["languages"])
        : {}),
    },
    hobbies: {
      ...defaults.hobbies,
      ...(typeof o.hobbies === "object" && o.hobbies !== null
        ? (o.hobbies as WizardStateV1["hobbies"])
        : {}),
    },
    courses: {
      ...defaults.courses,
      ...(typeof o.courses === "object" && o.courses !== null
        ? (o.courses as WizardStateV1["courses"])
        : {}),
    },
    internships: {
      ...defaults.internships,
      ...(typeof o.internships === "object" && o.internships !== null
        ? (o.internships as WizardStateV1["internships"])
        : {}),
    },
    certifications: {
      entries: normalizeCertEntries(
        (o.certifications as WizardStateV1["certifications"] | undefined)
          ?.entries,
        defaults.certifications.entries,
      ),
    },
    projects: {
      entries: normalizeProjectEntries(
        (o.projects as WizardStateV1["projects"] | undefined)?.entries,
        defaults.projects.entries,
      ),
    },
    additional: {
      ...defaults.additional,
      ...(typeof o.additional === "object" && o.additional !== null
        ? (o.additional as WizardStateV1["additional"])
        : {}),
    },
    layout: (() => {
      const rawLo =
        typeof o.layout === "object" && o.layout !== null
          ? (o.layout as Record<string, unknown>)
          : {};
      return {
        v: 1 as const,
        pageBreakBefore: {
          ...defaults.layout.pageBreakBefore,
          ...(typeof rawLo.pageBreakBefore === "object" &&
          rawLo.pageBreakBefore !== null &&
          !Array.isArray(rawLo.pageBreakBefore)
            ? (rawLo.pageBreakBefore as Record<string, boolean>)
            : {}),
        },
        sectionOrder: normalizeWizardSectionOrder(rawLo.sectionOrder),
      };
    })(),
  };

  const parsed = wizardStateSchema.safeParse(merged);
  if (!parsed.success) return defaults;
  const d = parsed.data;
  return {
    ...d,
    layout: {
      ...d.layout,
      sectionOrder: normalizeWizardSectionOrder(d.layout.sectionOrder),
    },
  };
}

function normalizeExperienceEntries(
  raw: unknown,
  fallback: WorkExperienceEntry[],
): WorkExperienceEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((e) => {
    const x = e as Partial<WorkExperienceEntry>;
    return {
      id: ensureEntryId(x.id),
      company: typeof x.company === "string" ? x.company : "",
      title: typeof x.title === "string" ? x.title : "",
      location: typeof x.location === "string" ? x.location : "",
      startDate: typeof x.startDate === "string" ? x.startDate : "",
      endDate: typeof x.endDate === "string" ? x.endDate : "",
      current: Boolean(x.current),
      highlights: Array.isArray(x.highlights)
        ? x.highlights.map((h) => String(h))
        : [""],
    };
  });
}

function normalizeEducationEntries(
  raw: unknown,
  fallback: EducationEntry[],
): EducationEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((e) => {
    const x = e as Partial<EducationEntry>;
    return {
      id: ensureEntryId(x.id),
      school: typeof x.school === "string" ? x.school : "",
      degree: typeof x.degree === "string" ? x.degree : "",
      field: typeof x.field === "string" ? x.field : "",
      startDate: typeof x.startDate === "string" ? x.startDate : "",
      endDate: typeof x.endDate === "string" ? x.endDate : "",
      current: Boolean(x.current),
      details: typeof x.details === "string" ? x.details : "",
    };
  });
}

function normalizeCertEntries(
  raw: unknown,
  fallback: CertificationEntry[],
): CertificationEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((e) => {
    const x = e as Partial<CertificationEntry>;
    return {
      id: ensureEntryId(x.id),
      name: typeof x.name === "string" ? x.name : "",
      issuer: typeof x.issuer === "string" ? x.issuer : "",
      issued: typeof x.issued === "string" ? x.issued : "",
      expires: typeof x.expires === "string" ? x.expires : "",
    };
  });
}

function normalizeProjectEntries(
  raw: unknown,
  fallback: ProjectEntry[],
): ProjectEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((e) => {
    const x = e as Partial<ProjectEntry>;
    return {
      id: ensureEntryId(x.id),
      name: typeof x.name === "string" ? x.name : "",
      url: typeof x.url === "string" ? x.url : "",
      description: typeof x.description === "string" ? x.description : "",
      technologies: typeof x.technologies === "string" ? x.technologies : "",
    };
  });
}
