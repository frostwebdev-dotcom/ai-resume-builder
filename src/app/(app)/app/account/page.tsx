import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  LifeBuoy,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, profile } = await requireUser();

  const memberSince = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(profile.created_at));

  const initial =
    (profile.display_name?.trim()?.[0] ??
      user.email?.[0] ??
      "U").toUpperCase();

  const details: Array<{
    label: string;
    value: string;
    icon: typeof Mail;
    breakAll?: boolean;
  }> = [
    {
      label: "Email",
      value: user.email ?? "—",
      icon: Mail,
      breakAll: true,
    },
    {
      label: "Display name",
      value: profile.display_name?.trim() || "—",
      icon: UserRound,
    },
    {
      label: "Member since",
      value: memberSince,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-8 sm:py-10">
      <PageContainer>
        <header className="space-y-3">
          <p className="text-eyebrow">Account</p>
          <SectionHeader
            level="page"
            title="Your account"
            description="Profile and sign-in details. Billing preferences can be added here later."
          />
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/8 blur-3xl"
            />
            <div className="relative flex items-start gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-brand-foreground shadow-soft ring-1 ring-foreground/10"
                aria-hidden
              >
                {initial}
              </span>
              <div className="min-w-0">
                <h2 className="text-subhead text-foreground">
                  {profile.display_name?.trim() || "Signed-in user"}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <hr className="hr-hairline my-6" />

            <dl className="grid gap-5 sm:grid-cols-2">
              {details.map(({ label, value, icon: Icon, breakAll }) => (
                <div key={label} className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1.5 text-base font-medium text-foreground",
                      breakAll && "break-all",
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15"
                  aria-hidden
                >
                  <KeyRound className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Sign-in &amp; security
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Reset your password via a secure email link.
              </p>
              <Link
                href={ROUTES.auth.forgotPassword}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-4 w-full justify-center gap-1",
                )}
              >
                Reset password
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/80 ring-1 ring-border"
                  aria-hidden
                >
                  <LifeBuoy className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Need help?
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Questions about billing or your resumes? We reply within 1–2
                business days.
              </p>
              <Link
                href={ROUTES.contact}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "mt-4 w-full justify-center gap-1",
                )}
              >
                Contact support
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </PageContainer>
    </section>
  );
}
