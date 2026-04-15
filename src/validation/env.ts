import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined ? undefined : value;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

const optionalSecret = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

/**
 * Server-only secrets and configuration.
 * Parsed at runtime in server contexts (Route Handlers, Server Actions, `lib/env` server export).
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,

  STRIPE_SECRET_KEY: optionalSecret,
  STRIPE_WEBHOOK_SECRET: optionalSecret,

  OPENAI_API_KEY: optionalSecret,
  /** Chat model for resume AI (e.g. gpt-4o-mini, gpt-4o). */
  OPENAI_MODEL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),

  RESEND_API_KEY: optionalSecret,
  /** e.g. "AI Resume Builder <mail@yourdomain.com>" — required for production sends once Resend domain is verified */
  EMAIL_FROM: z.preprocess(
    emptyToUndefined,
    z.string().min(3).optional(),
  ),
  EMAIL_REPLY_TO: z.preprocess(emptyToUndefined, z.string().email().optional()),

  /** Optional POST endpoint to receive JSON analytics payloads (BI / warehouse bridge). */
  ANALYTICS_WEBHOOK_URL: optionalUrl,

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalSecret,

  SENTRY_AUTH_TOKEN: optionalSecret,
  SENTRY_ORG: optionalSecret,
  SENTRY_PROJECT: optionalSecret,
});

/**
 * Variables exposed to the browser (must not contain secrets).
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (v === "" || v === undefined ? "http://localhost:3000" : v),
    z.string().url(),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalSecret,
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess(
    emptyToUndefined,
    z.union([z.string().url(), z.literal("")]).optional(),
  ),
  /** Set to "false" to disable browser analytics beacons. */
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.preprocess(
    (v) => (v === "true" || v === "false" ? v : undefined),
    z.enum(["true", "false"]).optional(),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
