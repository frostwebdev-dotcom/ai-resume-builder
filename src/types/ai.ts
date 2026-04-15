/** Shared AI action result shape (safe for client + server). */
export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
