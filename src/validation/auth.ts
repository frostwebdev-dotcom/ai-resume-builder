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

/** 6-digit code from the Supabase email OTP template (`{{ .Token }}`). */
export const emailOtpTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

/** First + last name collected in the guest `/app` sign-in panel before sending the magic link. */
export const panelSignInNameSchema = z.object({
  givenName: z.string().trim().min(1, "Enter your first name.").max(80),
  familyName: z.string().trim().min(1, "Enter your last name.").max(80),
});

/** Password + confirm after name on the guest `/app` email + password registration path. */
export const panelPasswordRegisterSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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
