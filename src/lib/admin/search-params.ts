/** Safe fragment for PostgREST `ilike` patterns (escapes `%` and `_`). */
export function escapeIlikePattern(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function parsePaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaults?: { pageSize?: number },
): { page: number; pageSize: number; q: string | undefined } {
  const pageRaw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const pageSizeRaw = Array.isArray(searchParams.pageSize) ? searchParams.pageSize[0] : searchParams.pageSize;
  const qRaw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;

  const page = Math.max(1, Number.parseInt(String(pageRaw ?? "1"), 10) || 1);
  const defaultSize = defaults?.pageSize ?? 25;
  const pageSize = Math.min(
    100,
    Math.max(10, Number.parseInt(String(pageSizeRaw ?? String(defaultSize)), 10) || defaultSize),
  );
  const q = typeof qRaw === "string" && qRaw.trim() ? qRaw.trim() : undefined;

  return { page, pageSize, q };
}

export function parseStatusParam(
  searchParams: Record<string, string | string[] | undefined>,
  allowed: readonly string[],
): string | undefined {
  const raw = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  if (!raw || !allowed.includes(raw)) return undefined;
  return raw;
}

export function parseOkParam(
  searchParams: Record<string, string | string[] | undefined>,
): "all" | "ok" | "error" {
  const raw = Array.isArray(searchParams.ok) ? searchParams.ok[0] : searchParams.ok;
  if (raw === "ok" || raw === "error") return raw;
  return "all";
}
