import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Lock,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { HomeJsonLd } from "@/components/marketing/home-json-ld";
import { MktSection } from "@/components/marketing/mkt-section";
import { ResumePreviewMock } from "@/components/marketing/resume-preview-mock";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ATS-friendly resumes in minutes",
  description:
    "Create a professional ATS-friendly resume in minutes. Preview free, pay only to export your PDF. Mobile-first editor built for real job searches.",
  openGraph: {
    title: `${APP_NAME} — ATS-friendly resumes in minutes`,
    description:
      "Create a professional ATS-friendly resume in minutes. Preview free, pay only to export your PDF.",
  },
};

const steps = [
  {
    title: "Answer a few prompts",
    body: "We structure your experience into clear sections recruiters and ATS tools understand.",
  },
  {
    title: "Edit with AI assistance",
    body: "Refine bullets, tighten wording, and keep a consistent tone — without fluff.",
  },
  {
    title: "Preview, then export",
    body: "Review on phone or desktop. Pay once when you are ready for your final PDF.",
  },
] as const;

const features = [
  {
    title: "ATS-aware structure",
    body: "Headings, dates, and skills laid out so parsers can read them reliably.",
  },
  {
    title: "Mobile editing",
    body: "Tweak your resume between meetings — layouts stay readable on small screens.",
  },
  {
    title: "Version history",
    body: "Iterate safely; keep snapshots as you tailor for different roles.",
  },
] as const;

const faqTeaser = [
  {
    q: "Do I need a subscription?",
    a: "No subscription required for launch. You can build and preview for free; you pay when you export your PDF.",
  },
  {
    q: "Is my data private?",
    a: "Your content is yours. We use secure infrastructure and only process what you submit to build your resume.",
  },
] as const;

export default function MarketingHomePage() {
  return (
    <>
      <HomeJsonLd />
      <MktSection className="relative overflow-hidden border-b border-border/60 bg-aurora pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-40 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]"
          aria-hidden
        />
        <PageContainer className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-[0.72rem] font-medium text-brand">
              <Sparkles className="size-3.5" aria-hidden />
              Preview free · pay once to export
            </span>
            <h1 className="mt-6 text-balance text-display text-foreground">
              Create a{" "}
              <span className="text-gradient-brand">professional</span>{" "}
              ATS-friendly resume in minutes.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-body-muted sm:text-lg">
              Structured sections, clear typography, and AI help where it matters — so you spend less
              time formatting and more time applying.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.auth.login}
                cta="start_free"
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                )}
              >
                Start free
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
              <TrackedLink
                href={ROUTES.pricing}
                cta="view_pricing"
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "sm:min-w-0")}
              >
                View pricing
              </TrackedLink>
            </div>
            <ul className="trust-row mt-8">
              <li>
                <ShieldCheck className="size-4 text-success" aria-hidden />
                <span>No credit card to preview</span>
              </li>
              <li>
                <Lock className="size-4 text-brand" aria-hidden />
                <span>Stripe-secured checkout</span>
              </li>
              <li>
                <Timer className="size-4 text-foreground/70" aria-hidden />
                <span>~10 min to a polished draft</span>
              </li>
            </ul>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection>
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">How it works</p>
            <h2 className="mt-3 text-headline">
              Three short steps from blank page to interview-ready
            </h2>
            <p className="mt-3 text-body-muted">
              A focused flow — no feature bloat, no tricks.
            </p>
          </div>
          <ol className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-xl border border-border/70 bg-card p-6 text-left shadow-soft"
              >
                <span className="brand-mark !size-9 !text-sm" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-subhead">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link
              href={ROUTES.howItWorks}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 text-muted-foreground",
              )}
            >
              Full walkthrough
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection className="bg-muted/25">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Built for real job searches</p>
            <h2 className="mt-3 text-headline">Focus on substance, not formatting</h2>
            <p className="mt-3 text-body-muted">
              Highlights that matter when you are moving fast and competing for attention.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <li key={f.title}>
                <Card interactive className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{f.body}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </PageContainer>
      </MktSection>

      <MktSection>
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-eyebrow">Preview-first billing</p>
              <h2 className="mt-3 text-headline">Preview before you pay</h2>
              <p className="mt-3 text-body-muted">
                See your resume as hiring managers will — on desktop and on the phone. When you are
                happy with the content, unlock PDF export at checkout.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  Clean, single-column layouts that read well on ATS
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  Large tap targets and legible type on mobile
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  Export only when you are ready — no surprise charges
                </li>
              </ul>
              <div className="mt-8">
                <TrackedLink
                  href={ROUTES.auth.login}
                  cta="hero_secondary"
                  className={cn(
                    buttonVariants({ size: "touch" }),
                    "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                  )}
                >
                  Create your resume
                  <ArrowRight className="size-4" aria-hidden />
                </TrackedLink>
              </div>
            </div>
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/10 via-transparent to-info/10 blur-2xl"
                aria-hidden
              />
              <ResumePreviewMock className="mx-auto w-full max-w-md shadow-elevated lg:mx-0" />
            </div>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection className="border-y border-border/60 bg-muted/20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Why job seekers trust this flow</h2>
            <p className="mt-2 text-body-muted">
              Straightforward pricing, no dark patterns — we want you confident at checkout.
            </p>
          </div>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-4 text-left text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex gap-2 rounded-lg border border-border/80 bg-background/80 p-4">
              <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">You stay in control.</strong> Edit any
                section; AI suggestions are optional helpers, not replacements for your judgment.
              </span>
            </li>
            <li className="flex gap-2 rounded-lg border border-border/80 bg-background/80 p-4">
              <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">Preview-first billing.</strong> Build
                and review for free; payment only unlocks your downloadable PDF.
              </span>
            </li>
          </ul>
        </PageContainer>
      </MktSection>

      <MktSection>
        <PageContainer>
          <div className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft sm:p-10">
            <p className="text-eyebrow justify-center">Transparent pricing</p>
            <h2 className="mt-3 text-headline">One purchase. No subscriptions.</h2>
            <p className="mt-3 text-body-muted">
              One clear payment to export your resume PDF. Add-ons like cover letters will roll out
              as optional upsells — always clearly labeled.
            </p>
            <TrackedLink
              href={ROUTES.pricing}
              cta="other"
              className={cn(
                buttonVariants({ size: "touch" }),
                "mt-8 inline-flex w-full max-w-xs gap-2 bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
              )}
            >
              See plans
              <ArrowRight className="size-4" aria-hidden />
            </TrackedLink>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection className="bg-muted/25">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Common questions</h2>
            <p className="mt-2 text-body-muted">Quick answers — read the full FAQ anytime.</p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {faqTeaser.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-border/80 bg-background px-4 py-4 text-left"
              >
                <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href={ROUTES.faq} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View all FAQs
            </Link>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection className="relative overflow-hidden border-t border-border/60 bg-aurora pb-20 pt-14 sm:pb-28 sm:pt-20">
        <PageContainer className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display">Ready in minutes</h2>
            <p className="mt-4 text-body-muted">
              Join and start your first resume — free to preview, pay only when you export.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.auth.login}
                cta="footer_signup"
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                )}
              >
                Start free
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
              <TrackedLink
                href={ROUTES.templates}
                cta="other"
                className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
              >
                Browse templates
              </TrackedLink>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
