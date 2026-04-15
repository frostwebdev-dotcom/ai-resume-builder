export function ensureEntryId(id: unknown): string {
  if (typeof id === "string" && id.length > 0) return id;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 12)}`;
}
