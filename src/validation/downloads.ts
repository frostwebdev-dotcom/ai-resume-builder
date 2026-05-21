import { z } from "zod";

export const resumeDownloadFileNameSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => {
    const sanitized = value
      .replace(/\.(pdf|docx|txt)$/i, "")
      .replace(/[^\p{L}\p{N} _-]+/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    return sanitized || undefined;
  });

export const downloadProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
  fileName: resumeDownloadFileNameSchema.optional(),
});
