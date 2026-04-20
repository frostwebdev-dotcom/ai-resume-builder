import { z } from "zod";

export const avatarActionSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
});

export type AvatarActionInput = z.infer<typeof avatarActionSchema>;
