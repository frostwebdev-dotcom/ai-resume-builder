import { formatUsdFromCents } from "@/lib/billing/format-money";

export function formatAdminDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatAdminMoney(cents: number, currency: string): string {
  if (currency.toLowerCase() === "usd") {
    return formatUsdFromCents(cents);
  }
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export function shortId(id: string, len = 8): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}
