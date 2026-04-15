import { z } from "zod";

export const downloadProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
});
