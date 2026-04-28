import type { WizardStateV1 } from "@/lib/resume-wizard/types";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 12)}`;
}

export function createEmptyWizardState(): WizardStateV1 {
  return {
    v: 1,
    personal: {
      fullName: "",
      givenName: "",
      middleName: "",
      familyName: "",
      photoDataUrl: "",
      desiredJobPosition: "",
      useJobPositionAsHeadline: false,
      email: "",
      phone: "",
      address: "",
      postCode: "",
      city: "",
      location: "",
      linkedIn: "",
      website: "",
      dateOfBirth: "",
      placeOfBirth: "",
      driversLicense: "",
      gender: "",
      nationality: "",
      civilStatus: "",
      customFieldLabel: "",
      customFieldValue: "",
      showNameIn: "title",
    },
    summary: {
      headline: "",
      summary: "",
    },
    experience: {
      entries: [
        {
          id: newId(),
          company: "",
          title: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          highlights: [""],
        },
      ],
    },
    education: {
      entries: [
        {
          id: newId(),
          school: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          current: false,
          details: "",
        },
      ],
    },
    skills: { lines: "" },
    languages: { lines: "" },
    hobbies: { lines: "" },
    courses: { lines: "" },
    internships: { lines: "" },
    certifications: {
      entries: [
        {
          id: newId(),
          name: "",
          issuer: "",
          issued: "",
          expires: "",
        },
      ],
    },
    projects: {
      entries: [
        {
          id: newId(),
          name: "",
          url: "",
          description: "",
          technologies: "",
        },
      ],
    },
    additional: { notes: "" },
    layout: {
      v: 1,
      pageBreakBefore: {},
    },
  };
}
