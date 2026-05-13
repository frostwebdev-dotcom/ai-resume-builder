import "server-only";

import { getOpenAIClient, getOpenAiChatModel, isOpenAiConfigured } from "@/lib/ai/openai-client";

/**
 * Low-level OpenAI client. Prefer `resume-ai` + `generation-core` for product flows.
 */
export const aiService = {
  getClient: getOpenAIClient,
  getChatModel: getOpenAiChatModel,
  isConfigured: isOpenAiConfigured,
};
