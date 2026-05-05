import { z } from "zod";

import { TEMPLATE_SLUG_ORDER } from "@/lib/resume-preview/template-ids";

export const resumeImportUploadInputSchema = z.object({
  templateSlug: z.enum(TEMPLATE_SLUG_ORDER),
  fileName: z.string().trim().max(240).default("resume"),
  mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  /** Base64-encoded file body (UTF-8 safe transport from client). */
  fileBase64: z.string().min(1).max(14_000_000),
});

const personalImport = z.object({
  givenName: z.string().max(80).default(""),
  middleName: z.string().max(80).default(""),
  familyName: z.string().max(80).default(""),
  fullName: z.string().max(120).default(""),
  email: z.string().max(320).default(""),
  phone: z.string().max(40).default(""),
  desiredJobPosition: z.string().max(200).default(""),
  linkedIn: z.string().max(500).default(""),
  website: z.string().max(500).default(""),
  address: z.string().max(240).default(""),
  postCode: z.string().max(32).default(""),
  city: z.string().max(120).default(""),
  location: z.string().max(160).default(""),
  useJobPositionAsHeadline: z.boolean().default(false),
  showNameIn: z.enum(["title", "personal", "both"]).default("title"),
});

const experienceImportEntry = z.object({
  company: z.string().max(160).default(""),
  title: z.string().max(160).default(""),
  location: z.string().max(120).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  current: z.boolean().default(false),
  highlights: z.array(z.string().max(500)).max(12).default([]),
});

const educationImportEntry = z.object({
  school: z.string().max(200).default(""),
  degree: z.string().max(120).default(""),
  field: z.string().max(160).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  current: z.boolean().default(false),
  details: z.string().max(2000).default(""),
});

const certificationImportEntry = z.object({
  name: z.string().max(200).default(""),
  issuer: z.string().max(160).default(""),
  issued: z.string().max(64).default(""),
  expires: z.string().max(64).default(""),
});

const projectImportEntry = z.object({
  name: z.string().max(160).default(""),
  url: z.string().max(500).default(""),
  description: z.string().max(4000).default(""),
  technologies: z.string().max(500).default(""),
});

const linesBlock = z.object({
  lines: z.string().max(8000).default(""),
});

/** Parsed AI JSON — merged into a full `WizardStateV1` on the server. */
export const resumeImportAiOutputSchema = z.object({
  personal: personalImport,
  summary: z.object({
    headline: z.string().max(200).default(""),
    /** Must fit `professionalSummarySchema` (HTML profile). */
    summaryHtml: z.string().max(4000).default(""),
  }),
  experience: z.object({
    entries: z.array(experienceImportEntry).max(14).default([]),
  }),
  education: z.object({
    entries: z.array(educationImportEntry).max(12).default([]),
  }),
  skills: z.object({
    lines: z.string().max(8000).default(""),
  }),
  languages: linesBlock.optional(),
  hobbies: linesBlock.optional(),
  courses: linesBlock.optional(),
  internships: linesBlock.optional(),
  certifications: z
    .object({
      entries: z.array(certificationImportEntry).max(20).default([]),
    })
    .optional(),
  projects: z
    .object({
      entries: z.array(projectImportEntry).max(20).default([]),
    })
    .optional(),
  additional: z
    .object({
      notes: z.string().max(6000).default(""),
    })
    .optional(),
});

export type ResumeImportAiOutput = z.infer<typeof resumeImportAiOutputSchema>;

export type ResumeImportUploadInput = z.infer<typeof resumeImportUploadInputSchema>;
