import "server-only";

import { createHash } from "crypto";

import OpenAI from "openai";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { getOpenAIClient, getOpenAiChatModel, isOpenAiConfigured } from "@/lib/ai/openai-client";
import { logAiGeneration } from "@/lib/ai/usage-logger";
import { GLOBAL_PROMPT_VERSION } from "@/services/ai/constants";
import {
  PROMPT_REGISTRY,
  AI_OPERATION_IDS,
  buildSystemPrompt,
  type AiOperationId,
} from "@/services/ai/prompts/registry";
import { checkAiUsageAllowed } from "@/services/ai/usage-limits";
import type { Json } from "@/types/database";
import type { z } from "zod";

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

/** Lower temperature for tighten/grammar; slightly higher for creative rewrites and tailoring. */
function temperatureForOperation(operationId: AiOperationId): number {
  switch (operationId) {
    case AI_OPERATION_IDS.SUMMARY_GRAMMAR:
    case AI_OPERATION_IDS.CONTENT_GRAMMAR:
      return 0.2;
    case AI_OPERATION_IDS.SUMMARY_SHORTEN:
    case AI_OPERATION_IDS.EXPERIENCE_SHORTEN:
    case AI_OPERATION_IDS.SKILLS_SHORTEN:
      return 0.24;
    case AI_OPERATION_IDS.SUMMARY_GENERATE:
    case AI_OPERATION_IDS.SUMMARY_TAILOR:
    case AI_OPERATION_IDS.SUMMARY_EXPAND:
    case AI_OPERATION_IDS.SUMMARY_IMPROVE:
    case AI_OPERATION_IDS.SUMMARY_PROFESSIONAL:
    case AI_OPERATION_IDS.EXPERIENCE_REWRITE_BULLETS:
    case AI_OPERATION_IDS.EXPERIENCE_STRENGTHEN:
    case AI_OPERATION_IDS.EXPERIENCE_EXPAND:
    case AI_OPERATION_IDS.SKILLS_REPHRASE:
    case AI_OPERATION_IDS.SUMMARY_TAILOR_JOB:
    case AI_OPERATION_IDS.SKILLS_TAILOR_JOB:
    case AI_OPERATION_IDS.EXPERIENCE_TAILOR_JOB:
      return 0.38;
    case AI_OPERATION_IDS.EDUCATION_POLISH_DETAILS:
      return 0.32;
    case AI_OPERATION_IDS.RESUME_IMPORT_PARSE:
      return 0.22;
    case AI_OPERATION_IDS.RESUME_SCORE:
      return 0.25;
    default:
      return 0.32;
  }
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
  /** When true, skips per-user AI quota (caller must enforce its own limiter). */
  skipUsageCheck?: boolean;
  /** When true, skips `ai_generation_logs` insert (e.g. anonymous guest import). */
  skipLogging?: boolean;
}): Promise<GenerationSuccess<T> | GenerationFailure> {
  if (!opts.skipUsageCheck) {
    const quota = await checkAiUsageAllowed(opts.userId);
    if (!quota.allowed) {
      return { ok: false, error: quota.reason, code: "RATE_LIMIT" };
    }
  }

  if (!isOpenAiConfigured()) {
    return {
      ok: false,
      error: "AI is not configured on this environment yet.",
      code: "NO_AI",
    };
  }

  const system = buildSystemPrompt(opts.operationId);
  const promptHash = hashPayload(system, opts.userMessage);
  const model = getOpenAiChatModel();
  const maxRetries = opts.maxRetries ?? 2;
  const client = getOpenAIClient();

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
        temperature: temperatureForOperation(opts.operationId),
      });

      const latency = Date.now() - started;
      const choice = completion.choices[0]?.message?.content;
      const usage = completion.usage;

      if (!choice?.trim()) {
        if (!opts.skipLogging) {
          await logAiGeneration({
            userId: opts.userId,
            projectId: opts.projectId,
            model,
            promptHash,
            ok: false,
            errorCode: "EMPTY_RESPONSE",
            latencyMs: latency,
            tokensPrompt: usage?.prompt_tokens ?? null,
            tokensCompletion: usage?.completion_tokens ?? null,
            metadata: buildLogMetadata(opts.operationId),
          });
        }
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
        if (!opts.skipLogging) {
          await logAiGeneration({
            userId: opts.userId,
            projectId: opts.projectId,
            model,
            promptHash,
            ok: false,
            errorCode: "JSON_PARSE",
            latencyMs: latency,
            tokensPrompt: usage?.prompt_tokens ?? null,
            tokensCompletion: usage?.completion_tokens ?? null,
            metadata: buildLogMetadata(opts.operationId),
          });
        }
        return {
          ok: false,
          error: "Could not read the AI response. Try again in a moment.",
          code: "JSON_PARSE",
        };
      }

      const safe = opts.outputSchema.safeParse(parsed);
      if (!safe.success) {
        if (!opts.skipLogging) {
          await logAiGeneration({
            userId: opts.userId,
            projectId: opts.projectId,
            model,
            promptHash,
            ok: false,
            errorCode: "SCHEMA_MISMATCH",
            latencyMs: latency,
            tokensPrompt: usage?.prompt_tokens ?? null,
            tokensCompletion: usage?.completion_tokens ?? null,
            metadata: buildLogMetadata(opts.operationId),
          });
        }
        return {
          ok: false,
          error: "The response did not match the expected format. Please retry.",
          code: "SCHEMA_MISMATCH",
        };
      }

      if (!opts.skipLogging) {
        await logAiGeneration({
          userId: opts.userId,
          projectId: opts.projectId,
          model,
          promptHash,
          ok: true,
          errorCode: null,
          latencyMs: latency,
          tokensPrompt: usage?.prompt_tokens ?? null,
          tokensCompletion: usage?.completion_tokens ?? null,
          metadata: buildLogMetadata(opts.operationId),
        });
      }

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

  if (!opts.skipLogging) {
    await logAiGeneration({
      userId: opts.userId,
      projectId: opts.projectId,
      model,
      promptHash,
      ok: false,
      errorCode: code.slice(0, 80),
      latencyMs: latency,
      tokensPrompt: null,
      tokensCompletion: null,
      metadata: buildLogMetadata(opts.operationId),
    });
  }

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

function buildLogMetadata(operationId: AiOperationId): Json {
  return {
    operation_id: operationId,
    global_prompt_version: GLOBAL_PROMPT_VERSION,
    bundle_version: PROMPT_REGISTRY[operationId]?.version ?? "unknown",
  };
}
