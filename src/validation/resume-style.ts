import { z } from "zod";

const hex6 = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB color.");

export const resumeStyleV1Schema = z.object({
  v: z.literal(1),
  accent: hex6.nullable(),
  accentStrong: hex6.nullable(),
  fontFamily: z.enum(["sans", "serif"]).nullable(),
  bodyTextAlign: z.enum(["left", "center", "justify"]).nullable(),
  headerTextAlign: z.enum(["left", "center", "right"]).nullable(),
  lineHeight: z.number().min(1.1).max(1.8).nullable(),
  sectionGapScale: z.number().min(0.7).max(1.45).nullable(),
  paragraphGapScale: z.number().min(0.7).max(1.45).nullable(),
  includeAvatar: z.boolean().nullable().default(null),
});

export const updateResumeStyleSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
  resumeStyle: resumeStyleV1Schema,
});
