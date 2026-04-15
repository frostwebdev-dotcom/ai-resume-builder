import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

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
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ATS-friendly resumes in minutes",
  description:
    "Create a professional ATS-friendly resume in minutes. Preview free, pay only to export your PDF. Mobile-first editor built for real job searches.",
  openGraph: {
    title: "AI Resume Builder — ATS-friendly resumes in minutes",
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
      <MktSection className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-background pb-16 pt-12 sm:pb-24 sm:pt-16">
        <PageContainer>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              AI Resume Builder
            </p>
            <h1 className="mt-4 text-balance text-display text-foreground">
              Create a professional ATS-friendly resume in minutes.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-body-muted sm:text-lg">
              Structured sections, clear typography, and AI help where it matters — so you spend less
              time formatting and more time applying.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.auth.signup}
                cta="start_free"
                className={cn(buttonVariants({ size: "touch" }))}
              >
                Start free
              </TrackedLink>
              <TrackedLink
                href={ROUTES.pricing}
                cta="view_pricing"
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "sm:min-w-0")}
              >
                View pricing
              </TrackedLink>
            </div>
            <p className="mt-4 text-caption">No credit card to preview · Export is a one-time purchase</p>
          </div>
        </PageContainer>
      </MktSection>

      <MktSection>
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">How it works</h2>
            <p className="mt-2 text-body-muted">
              Three short steps from blank page to interview-ready document.
            </p>
          </div>
          <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="text-center sm:text-left">
                <span className="text-caption font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
                <h3 className="mt-1 text-subhead">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
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
            <h2 className="text-headline">Built for real job searches</h2>
            <p className="mt-2 text-body-muted">
              Highlights that matter when you are moving fast and competing for attention.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <li key={f.title}>
                <Card className="h-full border-border/80 shadow-none">
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
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-headline">Preview before you pay</h2>
              <p className="mt-3 text-body-muted">
                See your resume as hiring managers will — on desktop and on the phone. When you are
                happy with the content, unlock PDF export in one step.
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
                  href={ROUTES.auth.signup}
                  cta="hero_secondary"
                  className={cn(buttonVariants({ size: "touch" }))}
                >
                  Create your resume
                </TrackedLink>
              </div>
            </div>
            <ResumePreviewMock className="mx-auto w-full max-w-md lg:mx-0" />
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
          <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            <h2 className="text-headline">Simple pricing</h2>
            <p className="mt-2 text-body-muted">
              One clear purchase for your resume export. Add-ons like cover letters will roll out as
              optional upsells — no surprise subscriptions.
            </p>
            <TrackedLink
              href={ROUTES.pricing}
              cta="other"
              className={cn(
                buttonVariants({ size: "touch" }),
                "mt-8 inline-flex w-full max-w-xs sm:w-auto",
              )}
            >
              See plans
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

      <MktSection className="border-t border-border/60 pb-20 pt-12 sm:pb-28 sm:pt-16">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Ready in minutes</h2>
            <p className="mt-3 text-body-muted">
              Join and start your first resume — free to preview, pay only when you export.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.auth.signup}
                cta="footer_signup"
                className={cn(buttonVariants({ size: "touch" }))}
              >
                Start free
              </TrackedLink>
              <TrackedLink
                href={ROUTES.templates}
                cta="other"
                className={cn(buttonVariants({ variant: "ghost", size: "touch" }))}
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
