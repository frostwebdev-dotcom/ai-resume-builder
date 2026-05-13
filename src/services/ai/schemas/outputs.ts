import { z } from "zod";

export const summaryPairOutputSchema = z.object({
  headline: z.string(),
  summary: z.string(),
});

export const bulletsOutputSchema = z.object({
  bullets: z.array(z.string()),
});

export const linesOutputSchema = z.object({
  lines: z.string(),
});

export const textOutputSchema = z.object({
  text: z.string(),
});

export const educationDetailsOutputSchema = z.object({
  details: z.string(),
});

export type SummaryPairOutput = z.infer<typeof summaryPairOutputSchema>;
export type BulletsOutput = z.infer<typeof bulletsOutputSchema>;
export type LinesOutput = z.infer<typeof linesOutputSchema>;
export const experienceBulletSuggestionSchema = z.object({
  bullet: z.string(),
  improvementNote: z.string().max(500).optional(),
});

export type ExperienceBulletSuggestion = z.infer<typeof experienceBulletSuggestionSchema>;

/** Short structured review: resume vs job posting (no full rewrites). */
export const jobTailorReviewOutputSchema = z.object({
  alignmentHighlights: z.array(z.string().max(400)).max(5).default([]),
  /** Honest gaps + optional “consider adding only if true” ideas — never fabricate experience. */
  improvementIdeas: z.array(z.string().max(400)).max(6).default([]),
});

export type JobTailorReviewOutput = z.infer<typeof jobTailorReviewOutputSchema>;
