import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (s) => s.length === 0 || /^https?:\/\/.+/i.test(s),
    "Use a full URL starting with http:// or https://",
  );

const optionalLinkedIn = z
  .string()
  .trim()
  .refine(
    (s) =>
      s.length === 0 ||
      /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(s) ||
      /^linkedin\.com\/.+/i.test(s),
    "Use a full LinkedIn profile URL.",
  );

export const workExperienceEntrySchema = z.object({
  id: z.string().uuid(),
  company: z.string().trim().max(160),
  title: z.string().trim().max(160),
  location: z.string().trim().max(120),
  startDate: z.string().trim().max(32),
  endDate: z.string().trim().max(32),
  current: z.boolean(),
  highlights: z.array(z.string().max(500)).max(24),
});

export const educationEntrySchema = z.object({
  id: z.string().uuid(),
  school: z.string().trim().max(200),
  degree: z.string().trim().max(120),
  field: z.string().trim().max(160),
  startDate: z.string().trim().max(32),
  endDate: z.string().trim().max(32),
  current: z.boolean(),
  details: z.string().trim().max(2000),
});

export const certificationEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(200),
  issuer: z.string().trim().max(160),
  issued: z.string().trim().max(64),
  expires: z.string().trim().max(64),
});

export const projectEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(160),
  url: optionalUrl,
  description: z.string().trim().max(4000),
  technologies: z.string().trim().max(500),
});

export const personalDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Add your full name.")
    .max(120, "Keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Add an email address.")
    .email("Use a valid email address."),
  phone: z.string().trim().max(40),
  location: z.string().trim().max(160),
  linkedIn: optionalLinkedIn,
  website: optionalUrl,
});

export const professionalSummarySchema = z.object({
  headline: z.string().trim().max(200),
  summary: z.string().trim().max(4000),
});

export const skillsBlockSchema = z.object({
  lines: z.string().trim().max(8000),
});

export const wizardStateSchema = z.object({
  v: z.literal(1),
  personal: z.object({
    fullName: z.string().trim().max(120),
    email: z.string().trim().max(320),
    phone: z.string().trim().max(40),
    location: z.string().trim().max(160),
    linkedIn: z.string().trim().max(500),
    website: z.string().trim().max(500),
  }),
  summary: professionalSummarySchema,
  experience: z.object({
    entries: z.array(workExperienceEntrySchema).max(32),
  }),
  education: z.object({
    entries: z.array(educationEntrySchema).max(16),
  }),
  skills: skillsBlockSchema,
  certifications: z.object({
    entries: z.array(certificationEntrySchema).max(24),
  }),
  projects: z.object({
    entries: z.array(projectEntrySchema).max(24),
  }),
  additional: z.object({
    notes: z.string().trim().max(6000),
  }),
});

/** Stricter validation for step 1 (before leaving Personal). */
export const personalStepSchema = personalDetailsSchema;

export type WizardStateInput = z.infer<typeof wizardStateSchema>;
