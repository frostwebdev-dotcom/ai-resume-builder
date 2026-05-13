import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type AiGenerationLogInput = {
  userId: string;
  projectId: string | null;
  model: string;
  promptHash: string;
  ok: boolean;
  errorCode: string | null;
  latencyMs: number;
  tokensPrompt: number | null;
  tokensCompletion: number | null;
  metadata: Json;
};

/**
 * Best-effort insert into `ai_generation_logs` (RLS: own user). Never throws.
 */
export async function logAiGeneration(opts: AiGenerationLogInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
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
      metadata: opts.metadata,
    });
  } catch {
    // Table missing or RLS — never fail the user flow
  }
}

export type AiSuggestionLogInput = {
  userId: string;
  projectId: string | null;
  kind: string;
  metadata: Json;
};

/**
 * Optional structured output audit (`ai_suggestions`). Never throws.
 */
export async function tryLogAiSuggestion(opts: AiSuggestionLogInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("ai_suggestions").insert({
      user_id: opts.userId,
      project_id: opts.projectId,
      kind: opts.kind,
      metadata: opts.metadata,
    });
  } catch {
    // Table not migrated yet or RLS
  }
}
