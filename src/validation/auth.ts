import { z } from "zod";

import { emailSchema } from "@/validation/common";

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordField,
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;
