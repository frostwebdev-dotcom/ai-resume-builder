import "server-only";

import OpenAI from "openai";

import { serverEnv } from "@/lib/env";

let client: OpenAI | null = null;

/** True when the server can call OpenAI (key present). */
export function isOpenAiConfigured(): boolean {
  return Boolean(serverEnv.OPENAI_API_KEY?.trim());
}

/** Chat/completions model — override with `OPENAI_MODEL` (e.g. `gpt-4o-mini`). */
export function getOpenAiChatModel(): string {
  return serverEnv.OPENAI_MODEL?.trim() || "gpt-4o";
}

/**
 * Singleton OpenAI SDK client. Throws if `OPENAI_API_KEY` is missing — callers
 * should gate on {@link isOpenAiConfigured} first for user-friendly errors.
 */
export function getOpenAIClient(): OpenAI {
  const key = serverEnv.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  if (!client) {
    client = new OpenAI({ apiKey: key });
  }
  return client;
}
