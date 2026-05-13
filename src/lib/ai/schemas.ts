import { z } from "zod";

import {
  baseAiContext,
  projectIdParam,
  summaryGenerateInput,
  tailorJobExperienceInput,
  tailorJobSkillsInput,
  tailorJobSummaryInput,
} from "@/validation/ai";

/** POST /api/ai/generate-summary */
export const apiGenerateSummaryBodySchema = summaryGenerateInput;

/** POST /api/ai/rewrite-bullet — single bullet rewrite (same model op as multi-bullet). */
export const apiRewriteBulletBodySchema = baseAiContext.extend({
  entryId: z.string().uuid(),
  company: z.string().trim().max(4000),
  title: z.string().trim().max(4000),
  bullet: z.string().trim().min(1, "Bullet text is required.").max(2000),
});

/** POST /api/ai/score-resume — server loads wizard from owned project. */
export const apiScoreResumeBodySchema = z.object({
  projectId: projectIdParam,
});

const tailorJobFields = z.object({
  jobTitle: z.string().trim().max(500).optional(),
  jobCompany: z.string().trim().max(500).optional(),
  jobDescription: z.string().trim().min(1).max(24000),
});

/** POST /api/ai/tailor-resume — job-aware rewrite for one section. */
export const apiTailorResumeBodySchema = z.discriminatedUnion("section", [
  baseAiContext.extend(tailorJobFields.shape).extend({
    section: z.literal("summary"),
    headline: z.string().trim().max(4000),
    summary: z.string().trim().max(8000),
  }),
  baseAiContext.extend(tailorJobFields.shape).extend({
    section: z.literal("skills"),
    lines: z.string().trim().max(8000),
  }),
  baseAiContext.extend(tailorJobFields.shape).extend({
    section: z.literal("experience"),
    entryId: z.string().uuid(),
    company: z.string().trim().max(4000),
    title: z.string().trim().max(4000),
    bullets: z.array(z.string().max(2000)).min(1).max(40),
  }),
]);

export type ApiGenerateSummaryBody = z.infer<typeof apiGenerateSummaryBodySchema>;
export type ApiRewriteBulletBody = z.infer<typeof apiRewriteBulletBodySchema>;
export type ApiScoreResumeBody = z.infer<typeof apiScoreResumeBodySchema>;
export type ApiTailorResumeBody = z.infer<typeof apiTailorResumeBodySchema>;

/** Model output for resume scoring (structured JSON). */
export const resumeScoreOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().max(2000),
  }),
  experience: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().max(2000),
  }),
  skills: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().max(2000),
  }),
  ats: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().max(2000),
  }),
  topActions: z.array(z.string().max(400)).max(8),
});

export type ResumeScoreOutput = z.infer<typeof resumeScoreOutputSchema>;

/** Map API tailor body to existing server action input shapes. */
function emptyToNull(s: string | undefined): string | null {
  if (s === undefined) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export function toTailorJobSummaryInput(
  body: Extract<ApiTailorResumeBody, { section: "summary" }>,
): z.infer<typeof tailorJobSummaryInput> {
  return {
    projectId: body.projectId,
    headline: body.headline,
    summary: body.summary,
    jobTitle: emptyToNull(body.jobTitle),
    jobCompany: emptyToNull(body.jobCompany),
    jobDescription: body.jobDescription,
  };
}

export function toTailorJobSkillsInput(
  body: Extract<ApiTailorResumeBody, { section: "skills" }>,
): z.infer<typeof tailorJobSkillsInput> {
  return {
    projectId: body.projectId,
    lines: body.lines,
    jobTitle: emptyToNull(body.jobTitle),
    jobCompany: emptyToNull(body.jobCompany),
    jobDescription: body.jobDescription,
  };
}

export function toTailorJobExperienceInput(
  body: Extract<ApiTailorResumeBody, { section: "experience" }>,
): z.infer<typeof tailorJobExperienceInput> {
  return {
    projectId: body.projectId,
    entryId: body.entryId,
    company: body.company,
    title: body.title,
    bullets: body.bullets,
    jobTitle: emptyToNull(body.jobTitle),
    jobCompany: emptyToNull(body.jobCompany),
    jobDescription: body.jobDescription,
  };
}
