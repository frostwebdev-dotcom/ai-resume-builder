import { z } from "zod";

import { isTemplateSlug } from "@/lib/resume-preview/template-ids";
import { resumeStyleV1Schema } from "@/validation/resume-style";

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

/** Payload to create a server project from the public `/create` guest draft (wizard + look). */
export const importGuestDraftPayloadSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    templateSlug: z.string().trim(),
    resumeStyle: resumeStyleV1Schema,
    wizard: z.unknown(),
  })
  .superRefine((data, ctx) => {
    if (!isTemplateSlug(data.templateSlug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid template.",
        path: ["templateSlug"],
      });
    }
  });
