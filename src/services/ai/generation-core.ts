import "server-only";

import { createHash } from "crypto";

import OpenAI from "openai";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { serverEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GLOBAL_PROMPT_VERSION } from "@/services/ai/constants";
import {
  PROMPT_REGISTRY,
  buildSystemPrompt,
  type AiOperationId,
} from "@/services/ai/prompts/registry";
import { checkAiUsageAllowed } from "@/services/ai/usage-limits";
import type { Json } from "@/types/database";
import type { z } from "zod";

import { aiService } from "./openai.service";

function hashPayload(system: string, user: string): string {
  return createHash("sha256")
    .update(`${system}\n---\n${user}`)
    .digest("hex")
    .slice(0, 48);
}

function extractJsonObject(content: string): unknown {
  const t = content.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  const inner = fence ? fence[1].trim() : t;
  return JSON.parse(inner) as unknown;
}

function isRetryableOpenAIError(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    const s = err.status;
    return s === 429 || s === 503 || s === 502 || s === 500;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type GenerationSuccess<T> = {
  ok: true;
  data: T;
};

export type GenerationFailure = {
  ok: false;
  error: string;
  code?: string;
};

export async function runStructuredGeneration<T>(opts: {
  operationId: AiOperationId;
  userId: string;
  projectId: string | null;
  userMessage: string;
  outputSchema: z.ZodType<T>;
  maxRetries?: number;
}): Promise<GenerationSuccess<T> | GenerationFailure> {
  const quota = await checkAiUsageAllowed(opts.userId);
  if (!quota.allowed) {
    return { ok: false, error: quota.reason, code: "QUOTA" };
  }

  if (!serverEnv.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "AI is not configured on this environment yet.",
      code: "NO_AI",
    };
  }

  const system = buildSystemPrompt(opts.operationId);
  const promptHash = hashPayload(system, opts.userMessage);
  const model = aiService.getChatModel();
  const maxRetries = opts.maxRetries ?? 2;
  const client = aiService.getClient();

  let lastError: unknown;
  const started = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: opts.userMessage },
        ],
        temperature: 0.35,
      });

      const latency = Date.now() - started;
      const choice = completion.choices[0]?.message?.content;
      const usage = completion.usage;

      if (!choice?.trim()) {
        await logAiGeneration({
          userId: opts.userId,
          projectId: opts.projectId,
          operationId: opts.operationId,
          model,
          promptHash,
          ok: false,
          errorCode: "EMPTY_RESPONSE",
          latencyMs: latency,
          tokensPrompt: usage?.prompt_tokens ?? null,
          tokensCompletion: usage?.completion_tokens ?? null,
        });
        return {
          ok: false,
          error: "The model returned empty content. Please try again.",
          code: "EMPTY_RESPONSE",
        };
      }

      let parsed: unknown;
      try {
        parsed = extractJsonObject(choice);
      } catch {
        await logAiGeneration({
          userId: opts.userId,
          projectId: opts.projectId,
          operationId: opts.operationId,
          model,
          promptHash,
          ok: false,
          errorCode: "JSON_PARSE",
          latencyMs: latency,
          tokensPrompt: usage?.prompt_tokens ?? null,
          tokensCompletion: usage?.completion_tokens ?? null,
        });
        return {
          ok: false,
          error: "Could not read the AI response. Try again in a moment.",
          code: "JSON_PARSE",
        };
      }

      const safe = opts.outputSchema.safeParse(parsed);
      if (!safe.success) {
        await logAiGeneration({
          userId: opts.userId,
          projectId: opts.projectId,
          operationId: opts.operationId,
          model,
          promptHash,
          ok: false,
          errorCode: "SCHEMA_MISMATCH",
          latencyMs: latency,
          tokensPrompt: usage?.prompt_tokens ?? null,
          tokensCompletion: usage?.completion_tokens ?? null,
        });
        return {
          ok: false,
          error: "The response did not match the expected format. Please retry.",
          code: "SCHEMA_MISMATCH",
        };
      }

      await logAiGeneration({
        userId: opts.userId,
        projectId: opts.projectId,
        operationId: opts.operationId,
        model,
        promptHash,
        ok: true,
        errorCode: null,
        latencyMs: latency,
        tokensPrompt: usage?.prompt_tokens ?? null,
        tokensCompletion: usage?.completion_tokens ?? null,
      });

      trackServerEvent(ANALYTICS_EVENTS.AI_GENERATION_USED, {
        operation: opts.operationId,
      });

      return { ok: true, data: safe.data };
    } catch (err) {
      lastError = err;
      if (isRetryableOpenAIError(err) && attempt < maxRetries) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      break;
    }
  }

  const latency = Date.now() - started;
  const code =
    lastError instanceof OpenAI.APIError ? String(lastError.status) : "UNKNOWN";

  await logAiGeneration({
    userId: opts.userId,
    projectId: opts.projectId,
    operationId: opts.operationId,
    model,
    promptHash,
    ok: false,
    errorCode: code.slice(0, 80),
    latencyMs: latency,
    tokensPrompt: null,
    tokensCompletion: null,
  });

  return {
    ok: false,
    error: friendlyErrorMessage(lastError),
    code,
  };
}

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return "The AI service is busy. Please wait a moment and try again.";
    }
    if (err.status === 401 || err.status === 403) {
      return "AI authentication failed. Check server configuration.";
    }
  }
  if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
    return "AI is not configured.";
  }
  return "Something went wrong with AI generation. Please try again.";
}

async function logAiGeneration(opts: {
  userId: string;
  projectId: string | null;
  operationId: AiOperationId;
  model: string;
  promptHash: string;
  ok: boolean;
  errorCode: string | null;
  latencyMs: number;
  tokensPrompt: number | null;
  tokensCompletion: number | null;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const metadata: Json = {
      operation_id: opts.operationId,
      global_prompt_version: GLOBAL_PROMPT_VERSION,
      bundle_version: PROMPT_REGISTRY[opts.operationId]?.version ?? "unknown",
    };
    await supabase.from("ai_generation_logs").insert({
      user_id: opts.userId,
      project_id: opts.projectId,
      section_id: null,
      provider: "openai",
      model: opts.model,
      prompt_hash: opts.promptHash,
      tokens_prompt: opts.tokensPrompt,
      tokens_completion: opts.tokensCompletion,
      latency_ms: opts.latencyMs,
      ok: opts.ok,
      error_code: opts.errorCode,
      metadata,
    });
  } catch {
    // Never fail user flow on logging
  }
}
