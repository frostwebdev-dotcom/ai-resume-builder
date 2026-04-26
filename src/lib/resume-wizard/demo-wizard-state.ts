import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

/**
 * Rich starter content so previews and template pickers show a credible résumé
 * (same copy for every template — typography and layout differ by template).
 * Fictional person and employers; safe for screenshots and demos.
 */
function buildDemoWizardState(): WizardStateV1 {
  return {
    v: 1,
    personal: {
      fullName: "Alex Rivera",
      givenName: "Alex",
      familyName: "Rivera",
      photoDataUrl: "",
      desiredJobPosition: "Senior product designer",
      useJobPositionAsHeadline: true,
      email: "arivera@example.com",
      phone: "+1 415 555 0142",
      address: "128 Market Street",
      postCode: "94103",
      city: "San Francisco, CA",
      location: "San Francisco · Remote",
      linkedIn: "linkedin.com/in/alexrivera-design",
      website: "https://alexrivera.design",
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
      headline: "Senior product designer — design systems · B2B SaaS",
      summary:
        "Product designer with 8+ years shipping end-to-end experiences for growth-stage SaaS. Led design systems adoption across three product lines, improving build consistency and cutting design–dev handoff time. Partner closely with PM and engineering on discovery, usability testing, and accessible UI patterns.",
    },
    experience: {
      entries: [
        {
          id: "f0000001-0000-4000-8000-000000000001",
          company: "Meridian Labs",
          title: "Lead product designer",
          location: "Remote · US",
          startDate: "Jan 2021",
          endDate: "",
          current: true,
          highlights: [
            "Owned the core analytics workflow used by 40k+ weekly active teams; simplified primary tasks and reduced support tickets for navigation by 22% YoY.",
            "Co-created a token-based design system (Figma + Storybook) adopted by 12 squads; cut time-to-first-screen for new features by roughly one sprint on average.",
            "Ran quarterly research with PM—synthesis fed roadmap bets; two initiatives launched from findings contributed to net revenue retention uplift in the following fiscal year.",
          ],
        },
        {
          id: "f0000001-0000-4000-8000-000000000002",
          company: "Northwind Analytics",
          title: "Product designer",
          location: "San Francisco, CA",
          startDate: "Jun 2018",
          endDate: "Dec 2020",
          current: false,
          highlights: [
            "Redesigned onboarding for data teams; raised activation within 14 days by a double-digit margin in A/B tests.",
            "Built prototypes and usability scripts for enterprise buyers; findings informed pricing page and sales demo story.",
          ],
        },
      ],
    },
    education: {
      entries: [
        {
          id: "f0000001-0000-4000-8000-000000000003",
          school: "California College of the Arts",
          degree: "BFA, Interaction Design",
          field: "Human-centered design",
          startDate: "2012",
          endDate: "2016",
          current: false,
          details: "Capstone: collaborative tool for distributed critique sessions.",
        },
      ],
    },
    skills: {
      lines: "Figma · FigJam · design systems · prototyping · usability testing · workshop facilitation\nHTML/CSS literacy · design tokens · Storybook · WCAG-oriented patterns\nStakeholder communication · roadmap alignment · written specs & crits",
    },
    languages: {
      lines: "English — native\nSpanish — professional working proficiency",
    },
    hobbies: { lines: "" },
    courses: { lines: "" },
    internships: { lines: "" },
    certifications: {
      entries: [
        {
          id: "f0000001-0000-4000-8000-000000000004",
          name: "NN/g UX Certification",
          issuer: "Nielsen Norman Group",
          issued: "2019",
          expires: "",
        },
      ],
    },
    projects: {
      entries: [
        {
          id: "f0000001-0000-4000-8000-000000000005",
          name: "Atlas design kit",
          url: "https://alexrivera.design/atlas",
          description:
            "Open documentation and component library for a multi-brand SaaS suite; used by design and engineering for shipping accessible patterns.",
          technologies: "Figma · React · Storybook · Chromatic",
        },
      ],
    },
    additional: {
      notes:
        "References available on request.\nVolunteer mentor, local design bootcamp (2022–present).",
    },
    layout: {
      v: 1,
      pageBreakBefore: {},
    },
  };
}

/** Validated demo snapshot — throws if schema drifts from demo shape. */
export function createDemoWizardState(): WizardStateV1 {
  const raw = buildDemoWizardState();
  const parsed = wizardStateSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[demo-wizard-state] schema drift", parsed.error.flatten());
    throw new Error("Demo wizard state failed validation; update demo-wizard-state.ts.");
  }
  return parsed.data;
}
