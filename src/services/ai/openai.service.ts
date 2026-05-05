import "server-only";

import OpenAI from "openai";

import { serverEnv } from "@/lib/env";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!serverEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return openai;
}

/** Configurable via `OPENAI_MODEL` (defaults to gpt-4o for stronger drafting). */
export function getOpenAiChatModel(): string {
  return serverEnv.OPENAI_MODEL ?? "gpt-4o";
}

/**
 * Low-level OpenAI client. Prefer `resume-ai` + `generation-core` for product flows.
 */
export const aiService = {
  getClient: getOpenAI,
  getChatModel: getOpenAiChatModel,
};
