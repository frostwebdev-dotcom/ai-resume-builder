export function formatExperienceDateRange(
  start: string,
  end: string,
  current: boolean,
): string {
  const s = start.trim();
  const e = end.trim();
  if (current) {
    return s ? `${s} — Present` : "Present";
  }
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  if (e) return e;
  return "";
}

export function formatEducationDateRange(
  start: string,
  end: string,
  current: boolean,
): string {
  return formatExperienceDateRange(start, end, current);
}

export function formatCertDate(issued: string, expires: string): string {
  const i = issued.trim();
  const x = expires.trim();
  if (i && x) return `${i} — ${x}`;
  if (i) return i;
  if (x) return `Expires ${x}`;
  return "";
}
