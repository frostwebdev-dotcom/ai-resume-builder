import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import {
  PAY_ONCE_PDF_PER_PROJECT_LINE,
  PDF_UNLOCK_PROJECT_SCOPE_LINE,
  PRICING_COMING_SOON_OFFERS,
  PRICING_HERO_TAGLINE,
  RESUME_PDF_EXPORT_PRICE_USD,
} from "@/lib/billing/monetization-copy";
import { ROUTES } from "@/lib/constants";
import { getPublicSupportEmailDisplay } from "@/lib/email/support-inbox";
import { cn } from "@/lib/utils";

const launchPdf = BILLING_PRODUCTS.resume_pdf_v1;

const pricingFaq = [
  {
    q: "Is it free to start?",
    a: `Yes. Open ${ROUTES.create} to draft and preview without paying. Sign in when you want your work saved to your account and to unlock PDF export from a project.`,
  },
  {
    q: "When do I pay?",
    a: `Only when you choose to export. Inside a saved resume project, open Preview & export and start checkout when you want the downloadable PDF. Until then, editing and on-screen preview stay free.`,
  },
  {
    q: "Is it a subscription?",
    a: "No subscription at launch. You pay once per resume project to unlock PDF export for that project — not a recurring plan.",
  },
  {
    q: "Can I edit after paying?",
    a: PDF_UNLOCK_PROJECT_SCOPE_LINE,
  },
  {
    q: "What happens if payment fails?",
    a: "Stripe handles the card step. If checkout does not complete, you are not charged and your project stays in preview-only mode. If you believe you were charged but the app did not unlock, contact support with the email on your account and we will help match it to Stripe.",
  },
  {
    q: "Can I get support?",
    a: `Yes. Visit our contact page for billing questions or product help. Include your account email and, for payments, the approximate date of purchase.`,
  },
] as const;

export const metadata: Metadata = {
  title: "Pricing — pay only to export your PDF",
  description: `${PRICING_HERO_TAGLINE} Resume PDF export is ${RESUME_PDF_EXPORT_PRICE_USD} once per project at checkout (no subscription). Future add-ons are marked coming soon.`,
  openGraph: {
    title: `Pricing — ${RESUME_PDF_EXPORT_PRICE_USD} PDF export`,
    description: PRICING_HERO_TAGLINE,
  },
};

export default function PricingPage() {
  const supportEmail = getPublicSupportEmailDisplay();

  return (
    <>
      {/* Hero */}
      <MktSection className="border-b border-border/50 bg-muted/15 pb-12 pt-12 sm:pb-16 sm:pt-20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Pricing</p>
            <h1 className="mt-4 text-balance text-display text-foreground">One launch price. No subscription.</h1>
            <p className="mt-4 text-pretty text-lg font-medium text-foreground/90 sm:text-xl">
              {PRICING_HERO_TAGLINE}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-body-muted">
              {PAY_ONCE_PDF_PER_PROJECT_LINE}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
              <TrackedLink
                href={ROUTES.create}
                cta="start_building"
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                )}
              >
                Start building free
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </TrackedLink>
              <Link
                href={ROUTES.faq}
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "bg-background/80")}
              >
                Read FAQ
              </Link>
            </div>
          </div>
        </PageContainer>
      </MktSection>

      {/* Main offer */}
      <MktSection id="resume-pdf-export" className="pb-8 sm:pb-12">
        <PageContainer>
          <div className="mx-auto max-w-lg">
            <article>
              <Card className="overflow-hidden border-brand/35 shadow-elevated ring-1 ring-brand/20">
                <CardHeader className="border-b border-border/60 bg-brand/[0.06] pb-6 pt-6 sm:pb-8 sm:pt-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-foreground">
                      Available now
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">No subscription</span>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {launchPdf.label}
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{launchPdf.description}</p>
                  <p className="mt-6 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      {RESUME_PDF_EXPORT_PRICE_USD}
                    </span>
                    <span className="text-sm text-muted-foreground">once per resume project · plus tax if applicable</span>
                  </p>
                </CardHeader>
                <CardContent className="pt-6 sm:pt-8">
                  <p className="text-sm font-medium text-foreground">What is included</p>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <strong className="font-medium text-foreground">Build and preview for free</strong> until you
                        choose to checkout for this project.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <strong className="font-medium text-foreground">Pay once per resume project</strong> — the
                        amount at Stripe checkout matches the price shown above for this product.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <strong className="font-medium text-foreground">Preview before payment</strong> — you only pay
                        when you are ready to download the PDF file.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <strong className="font-medium text-foreground">Re-download after edits</strong> —{" "}
                        {PDF_UNLOCK_PROJECT_SCOPE_LINE}
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <strong className="font-medium text-foreground">Stripe-secured checkout</strong> — we do not
                        store your full card number on our servers.
                      </span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/25 px-6 py-6 sm:px-8">
                  <TrackedLink
                    href={ROUTES.create}
                    cta="start_building"
                    className={cn(
                      buttonVariants({ size: "touch" }),
                      "w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90",
                    )}
                  >
                    Start building free
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </TrackedLink>
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    Checkout runs on Stripe; tax may be added based on your location. Unlock applies to the project you
                    pay for — not every project on your account.
                  </p>
                </CardFooter>
              </Card>
            </article>
          </div>
        </PageContainer>
      </MktSection>

      {/* Future upsells — visually distinct, non-purchasable */}
      <MktSection className="border-t border-border/50 bg-muted/20 pb-4 pt-4 sm:pb-8 sm:pt-8">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center text-muted-foreground">Coming later</p>
            <h2 className="mt-3 text-headline text-balance">Future add-ons</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              These are not sold in the app today. Prices and scope may change before launch — we will label checkout
              clearly when they go live.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 sm:gap-5">
            {PRICING_COMING_SOON_OFFERS.map((offer) => (
              <li key={offer.sku}>
                <Card
                  className={cn(
                    "relative h-full border-dashed border-border/80 bg-background/60 opacity-95",
                    "ring-1 ring-foreground/[0.04]",
                  )}
                >
                  <span className="absolute right-3 top-3 rounded-full border border-border bg-muted/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Coming soon
                  </span>
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="pr-24 text-lg">{offer.headline}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{offer.teaser}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <HelpCircle className="size-3.5 shrink-0" aria-hidden />
                      Not available in checkout yet — no charge.
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </PageContainer>
      </MktSection>

      {/* FAQ */}
      <MktSection id="pricing-faq" className="border-t border-border/50">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Questions about pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Short answers — see the full FAQ for more detail.</p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {pricingFaq.map((item) => (
              <section
                key={item.q}
                className="rounded-xl border border-border/80 bg-card px-4 py-4 text-left sm:px-5 sm:py-5"
              >
                <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </section>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href={ROUTES.faq} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View all FAQs
            </Link>
          </div>
        </PageContainer>
      </MktSection>

      {/* Trust */}
      <MktSection className="border-t border-border/50 bg-muted/15 pb-16 sm:pb-20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Why you can buy with confidence</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Straightforward pricing and infrastructure you already trust elsewhere on the web.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
            <li className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 text-left text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">Secure checkout.</strong> Card collection and receipts
                are handled by Stripe.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 text-left text-sm text-muted-foreground">
              <Shield className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">Private resume data.</strong> Your content is stored for
                the service we provide — not sold for ads.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 text-left text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">No hidden subscription.</strong> Launch pricing is a
                one-time PDF unlock per project — we will label new plans loudly if we add them.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 text-left text-sm text-muted-foreground">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">Clear support contact.</strong>{" "}
                <Link href={ROUTES.contact} className="font-medium text-brand underline-offset-4 hover:underline">
                  Contact page
                </Link>
                {supportEmail ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={`mailto:${supportEmail}`}
                      className="font-medium text-brand underline-offset-4 hover:underline"
                    >
                      {supportEmail}
                    </a>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {" "}
                    — set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_CONTACT_EMAIL</code> to
                    show a public inbox here.
                  </span>
                )}
              </span>
            </li>
          </ul>
        </PageContainer>
      </MktSection>
    </>
  );
}
