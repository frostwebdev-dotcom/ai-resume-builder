import { z } from "zod";

export const saveJobTargetSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().max(500).optional(),
  company: z.string().trim().max(500).optional(),
  jobDescription: z
    .string()
    .trim()
    .min(1, "Paste a job description to save.")
    .max(24_000),
});

export const projectIdOnlySchema = z.object({
  projectId: z.string().uuid(),
});
