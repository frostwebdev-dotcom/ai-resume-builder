import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  Clock,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ContactForm } from "@/components/marketing/contact-form";
import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { getPublicSupportEmailDisplay } from "@/lib/email/support-inbox";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact & support",
    description: `Contact ${APP_NAME} for product questions, billing, and support.`,
  };
}

function getSupportEmail(): string | null {
  return getPublicSupportEmailDisplay();
}

type ContactTopic = {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
};

const topics: ContactTopic[] = [
  {
    icon: CircleHelp,
    title: "Product questions",
    body: "Something unclear about editing, templates, or ATS behavior?",
  },
  {
    icon: ShieldCheck,
    title: "Billing & refunds",
    body: (
      <>
        Include the email on your account and the date of purchase. For policy detail, see our{" "}
        <Link
          href={ROUTES.refundPolicy}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Refund policy
        </Link>
        .
      </>
    ),
  },
  {
    icon: Sparkles,
    title: "Partnerships & press",
    body: "Integration ideas, careers pages, or coverage — we'd love to hear.",
  },
];

export default function ContactPage() {
  const supportEmail = getSupportEmail();
  const mailto = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(`${APP_NAME} — inquiry`)}`
    : null;

  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow justify-center">Contact &amp; support</p>
          <h1 className="mt-3 text-display">
            We <span className="text-gradient-brand">read every message</span>
          </h1>
          <p className="mt-4 text-body-muted">
            Questions about the product, billing, or partnerships — drop a line and we&apos;ll get
            back to you.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="space-y-4">
            {topics.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-6"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand ring-1 ring-brand/15"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</div>
                </div>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Prefer to start right away?{" "}
              <Link
                href={ROUTES.create}
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Start a free resume
              </Link>{" "}
              before creating an account.
            </p>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <ContactForm />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <span
                className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-soft"
                aria-hidden
              >
                <Mail className="size-5" />
              </span>
              <h2 className="mt-5 text-subhead">
                {supportEmail ? "Email us directly" : "We respond through the form"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {supportEmail ? (
                  <>
                    The fastest path for many teams. Include as much context as you can — we&apos;ll follow
                    up with clarifying questions if needed.
                  </>
                ) : (
                  <>
                    The secure form above creates a traceable thread for billing and technical issues.
                    Add a public support address below when you are ready — it will appear here automatically.
                  </>
                )}
              </p>
              {supportEmail && mailto ? (
                <>
                  <a
                    href={mailto}
                    className="mt-5 inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-brand-muted px-3.5 py-2.5 text-sm font-semibold text-brand ring-1 ring-brand/15 transition-colors hover:bg-brand hover:text-brand-foreground"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{supportEmail}</span>
                  </a>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Pulled from{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      NEXT_PUBLIC_CONTACT_EMAIL
                    </code>{" "}
                    in your deployment environment.
                  </p>
                </>
              ) : (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Set{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    NEXT_PUBLIC_CONTACT_EMAIL
                  </code>{" "}
                  to display a clickable support inbox for visitors who prefer email over the form.
                </p>
              )}

              <hr className="hr-hairline my-6" />

              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-foreground/70" aria-hidden />
                  We reply within 1–2 business days
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="size-4 text-brand" aria-hidden />
                  Messages are treated as confidential
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success" aria-hidden />
                  We never share your email with third parties
                </li>
              </ul>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={ROUTES.faq}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1",
                  )}
                >
                  Read the FAQ
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </MktSection>
  );
}
