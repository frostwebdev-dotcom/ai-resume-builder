import { z } from "zod";

/** Shared field primitives for API and form schemas. */
export const idSchema = z.string().uuid();

/** Normalizes email: trim + lowercase (safe for auth and storage keys). */
export const emailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().email("Enter a valid email address."));

export const nonEmptyString = z.string().trim().min(1);
