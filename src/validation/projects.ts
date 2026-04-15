import { z } from "zod";

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(120, "Name is too long."),
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
