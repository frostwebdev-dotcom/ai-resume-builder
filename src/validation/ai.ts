import { z } from "zod";

const MAX_CHUNK = 14_000;

export const projectIdParam = z.string().uuid();

export const baseAiContext = z.object({
  projectId: projectIdParam,
});

export const summaryGenerateInput = baseAiContext.extend({
  headline: z.string().trim().max(4000),
  existingSummary: z.string().trim().max(8000),
  notes: z.string().trim().max(8000).optional(),
});

export const summaryTailorInput = baseAiContext.extend({
  headline: z.string().trim().max(4000),
  summary: z.string().trim().max(8000),
  targetRole: z.string().trim().min(3, "Add a target role or job title.").max(2000),
  jobFocus: z.string().trim().max(8000).optional(),
});

export const summaryTextOpInput = baseAiContext.extend({
  headline: z.string().trim().max(4000),
  summary: z.string().trim().max(8000),
});

export const experienceBulletsInput = baseAiContext.extend({
  entryId: z.string().uuid(),
  company: z.string().trim().max(4000),
  title: z.string().trim().max(4000),
  bullets: z.array(z.string().max(2000)).max(40),
});

export const educationPolishInput = baseAiContext.extend({
  entryId: z.string().uuid(),
  school: z.string().trim().max(4000),
  degree: z.string().trim().max(4000),
  field: z.string().trim().max(2000),
  details: z.string().trim().max(8000),
});

export const skillsTextInput = baseAiContext.extend({
  lines: z.string().trim().max(8000),
});

export const additionalTextInput = baseAiContext.extend({
  text: z.string().trim().max(8000),
});

/** Tailoring using a full job posting (server merges JD from `job_targets`). */
export const tailorJobSummaryInput = baseAiContext.extend({
  headline: z.string().trim().max(4000),
  summary: z.string().trim().max(8000),
  jobTitle: z.string().trim().max(500).nullable(),
  jobCompany: z.string().trim().max(500).nullable(),
  jobDescription: z.string().trim().min(1).max(24000),
});

export const tailorJobSkillsInput = baseAiContext.extend({
  lines: z.string().trim().max(8000),
  jobTitle: z.string().trim().max(500).nullable(),
  jobCompany: z.string().trim().max(500).nullable(),
  jobDescription: z.string().trim().min(1).max(24000),
});

export const tailorJobExperienceInput = experienceBulletsInput.extend({
  jobTitle: z.string().trim().max(500).nullable(),
  jobCompany: z.string().trim().max(500).nullable(),
  jobDescription: z.string().trim().min(1).max(24000),
});

/** Client/server actions: project section only — job posting loaded in the action. */
export const tailorSummaryJobActionInput = baseAiContext.extend({
  headline: z.string().trim().max(4000),
  summary: z.string().trim().max(8000),
});

export const tailorSkillsJobActionInput = baseAiContext.extend({
  lines: z.string().trim().max(8000),
});

export function assertReasonablePayloadSize(
  parts: string[],
  label = "request",
): void {
  const total = parts.reduce((a, b) => a + b.length, 0);
  if (total > MAX_CHUNK) {
    throw new Error(
      `${label} is too long. Try shortening your content and try again.`,
    );
  }
}
