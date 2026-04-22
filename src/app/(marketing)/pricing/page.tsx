import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard, Lock, ShieldCheck } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { formatUsdFromCents } from "@/lib/billing/format-money";

const RESUME_PDF_CHECKOUT_PRICE = formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents);

export const metadata: Metadata = {
  title: "Pricing",
  description:
    `Resume PDF export (${RESUME_PDF_CHECKOUT_PRICE} today in checkout): free draft and preview, then a one-time purchase to unlock downloads for that project. Cover letter and bundles are not sold yet.`,
};

const plans = [
  {
    name: "Resume PDF",
    price: "Pay once",
    description:
      "When your resume is ready in a project, pay once to unlock PDF generation and downloads for that same project—including after you make edits.",
    bullets: [
      "Draft & preview are free first",
      "Readable templates for screen and print",
      "Private storage; downloads use short-lived signed links",
    ],
    cta: "Start free",
    href: ROUTES.auth.login,
    featured: true,
    footnote: `Checkout lists ${RESUME_PDF_CHECKOUT_PRICE} for this product today; Stripe may add taxes where applicable. No subscription.`,
  },
  {
    name: "Resume + Cover letter",
    price: "Coming soon",
    description:
      "Planned add-on: matched cover letter from your resume and job context. Not available for purchase in the app yet.",
    bullets: [
      "Checkout style aligned with resume PDF (when shipped)",
      "Tone aligned to your resume and posting (when shipped)",
      "Downloadable PDF (when shipped)",
    ],
    cta: "Get notified",
    href: ROUTES.contact,
    featured: false,
    footnote: "Optional add-on — pricing TBD.",
  },
  {
    name: "Premium bundle",
    price: "Future",
    description:
      "Ideas only for now—nothing here is sold or entitled in checkout yet. We may ship pieces of this over time.",
    bullets: ["Job-specific passes (roadmap)", "Version packs (roadmap)", "Priority support (exploring)"],
    cta: "Contact us",
    href: ROUTES.contact,
    featured: false,
    footnote: "Not available yet — schema and checkout will evolve without breaking core pricing.",
  },
] as const;

export default function PricingPage() {
  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow justify-center">Pricing</p>
          <h1 className="mt-3 text-display">Pay when you export your PDF</h1>
          <p className="mt-4 text-body-muted">
            {`Draft and preview are free (including on ${ROUTES.create} before you sign in). After you have a project, pay once—currently ${RESUME_PDF_CHECKOUT_PRICE} in Stripe checkout—to unlock PDF export and downloads for that project. No subscription at launch.`}
          </p>
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.name} className="relative">
              {plan.featured ? (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-brand-foreground shadow-soft">
                  Most popular
                </span>
              ) : null}
              <Card
                interactive={!plan.featured}
                className={cn(
                  "flex h-full flex-col",
                  plan.featured &&
                    "border-brand/40 shadow-elevated ring-1 ring-brand/25",
                )}
              >
                <CardHeader>
                  <p
                    className={cn(
                      "text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
                      plan.featured ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {plan.featured
                      ? "Current focus"
                      : plan.price === "Coming soon"
                        ? "Roadmap"
                        : "Future"}
                  </p>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base font-semibold text-foreground">
                    {plan.price}
                  </CardDescription>
                  <CardDescription className="pt-1 text-sm leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {plan.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t border-border/60 bg-muted/20">
                  <Link
                    href={plan.href}
                    className={cn(
                      buttonVariants({
                        size: "touch",
                        variant: plan.featured ? "default" : "outline",
                      }),
                      plan.featured &&
                        "bg-brand text-brand-foreground hover:bg-brand/90",
                    )}
                  >
                    {plan.cta}
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">{plan.footnote}</p>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          <p className="text-eyebrow justify-center">Secure checkout</p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Taxes may apply based on your region. Stripe handles checkout securely — we never store
            card numbers on our servers.
          </p>
          <ul className="trust-row mt-5">
            <li>
              <Lock className="size-4 text-brand" aria-hidden />
              <span>Stripe-secured</span>
            </li>
            <li>
              <ShieldCheck className="size-4 text-success" aria-hidden />
              <span>256-bit TLS in transit</span>
            </li>
            <li>
              <CreditCard className="size-4 text-foreground/70" aria-hidden />
              <span>One-time charge</span>
            </li>
          </ul>
        </div>
      </PageContainer>
    </MktSection>
  );
}
