import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

/**
 * `/signup` is kept as a permanent redirect to the unified `/login` entry.
 * The login page handles both new and returning users (magic link auto-creates the account
 * on first click, password sign-in works for existing users).
 *
 * Preserving the route keeps existing inbound links (old emails, shared URLs, SEO, external blogs)
 * working without 404s.
 */
type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const sp = await searchParams;
  const next = firstParam(sp.next);
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  params.set("intent", "signup");
  redirect(`${ROUTES.auth.login}?${params.toString()}`);
}

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
