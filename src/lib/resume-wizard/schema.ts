import { z } from "zod";

/**
 * URL validation for wizard fields is intentionally forgiving.
 *
 * - Users routinely paste `www.example.com` or `linkedin.com/in/foo`
 *   without a scheme; blocking "Next" on that was a common source of
 *   friction. We accept bare domains here and let the downstream PDF
 *   renderer (`normaliseUrl` in render-resume-pdf.ts) prepend `https://`
 *   when emitting clickable links.
 * - We still reject obvious junk (single words, whitespace-only input,
 *   entries without a TLD) so typos don't silently land in the export.
 */
function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }
  // Host must have at least one dot ("example.com") to avoid accepting
  // inputs like "notaurl" or "localhost".
  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    parsed.hostname.length >= 3 &&
    parsed.hostname.includes(".")
  );
}

function isLikelyLinkedInUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }
  // Accept linkedin.com, www.linkedin.com, and any regional subdomain
  // (uk.linkedin.com, de.linkedin.com, cn.linkedin.com, …). The pathname
  // must point at a real profile/page, not just the domain root.
  const host = parsed.hostname.toLowerCase();
  return /(^|\.)linkedin\.com$/i.test(host) && parsed.pathname.length > 1;
}

const optionalUrl = z
  .string()
  .trim()
  .refine(
    isLikelyUrl,
    "Enter a web address (example.com or https://example.com).",
  );

const optionalLinkedIn = z
  .string()
  .trim()
  .refine(
    isLikelyLinkedInUrl,
    "Enter a LinkedIn profile URL (e.g. linkedin.com/in/your-name).",
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
