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
