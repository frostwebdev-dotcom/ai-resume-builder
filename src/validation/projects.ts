import { z } from "zod";

import { isTemplateSlug } from "@/lib/resume-preview/template-ids";

export const createProjectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Enter a name.")
      .max(120, "Name is too long."),
    /** Optional layout slug — must match a built-in theme when provided. */
    templateSlug: z
      .string()
      .trim()
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.templateSlug !== undefined && !isTemplateSlug(data.templateSlug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid template.",
        path: ["templateSlug"],
      });
    }
  });

export const renameProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
  title: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(120, "Name is too long."),
});

export const projectIdSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
});

export const setProjectTemplateSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
  templateId: z.string().uuid("Invalid template."),
});
