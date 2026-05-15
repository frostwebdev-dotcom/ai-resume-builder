import type { Metadata } from "next";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleSlash2,
  Lock,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { HomeJsonLd } from "@/components/marketing/home-json-ld";
import { HomeResumeShowcase } from "@/components/marketing/home-resume-showcase";
import { MktSection } from "@/components/marketing/mkt-section";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PAY_ONCE_PDF_PER_PROJECT_LINE,
  RESUME_PDF_EXPORT_PRICE_USD,
} from "@/lib/billing/monetization-copy";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { APP_NAME, ROUTES } from "@/lib/constants";

const PRIMARY_HEADLINE = "Create a professional ATS-friendly resume in minutes.";

export const metadata: Metadata = {
  title: PRIMARY_HEADLINE,
  description:
    "Build and preview your resume for free. Use optional AI to tighten your wording, pick a professional template, then pay only when you download your final PDF — no subscription.",
  openGraph: {
    title: `${APP_NAME} — ${PRIMARY_HEADLINE}`,
    description:
      "Build and preview for free. Pay once per resume project when you export your PDF — Stripe checkout, mobile-friendly editor.",
  },
};

const howItWorksSteps = [
  {
    title: "Build your resume",
    body: "Start on the web editor — no account required to draft. Add roles, skills, and education in clear sections.",
  },
  {
    title: "Improve with AI",
    body: "Optional AI assist helps you tighten summaries and bullets on saved projects. You stay in control — review every line before you apply.",
  },
  {
    title: "Preview templates",
    body: "Switch layouts and fine-tune typography until it feels interview-ready on desktop and phone.",
  },
  {
    title: "Pay only when ready",
    body: `Checkout is a one-time unlock for that resume project — typically ${RESUME_PDF_EXPORT_PRICE_USD} today (see Pricing).`,
  },
  {
    title: "Download PDF",
    body: "Get a print-ready file after payment confirms. Re-download when you edit — same project, no extra charge.",
  },
] as const;

const templateArchetypes = [
  {
    name: "Professional ATS",
    body: "Straightforward hierarchy, readable dates, and familiar section order — designed so typical applicant tracking systems can map your experience.",
  },
  {
    name: "Modern Professional",
    body: "Balanced white space and confident typography for roles where presentation matters alongside substance.",
  },
  {
    name: "Technical Clean",
    body: "Crisp structure and scannable blocks suited to engineering, product, and operations profiles.",
  },
] as const;

const faqTeaser = [
  {
    q: "Is it free to start?",
    a: "Yes. You can open the editor and build your resume without paying. Creating a free account lets you save projects and use optional AI on your content.",
  },
  {
    q: "Do I need to pay before preview?",
    a: "No. Preview and editing are free. Payment only unlocks exporting your resume as a PDF for that project when you are ready.",
  },
  {
    q: "Is this ATS-friendly?",
    a: "We focus on conventional headings, linear reading order, and plain text semantics — patterns common parsers expect. Every employer system is different, so we never promise a guaranteed pass.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Yes. The editor and preview are built mobile-first so you can edit on your phone between meetings.",
  },
] as const;

const aiBefore =
  "Worked on website and fixed bugs.";
const aiAfter =
  "Improved website functionality by resolving UI issues, optimizing user flows, and supporting frontend enhancements across key pages.";

export default function MarketingHomePage() {
  return (
    <>
      <HomeJsonLd />

      {/* 1. Hero */}
      <MktSection
        id="top"
        className="relative overflow-hidden border-b border-border/60 bg-aurora pb-16 pt-12 sm:pb-24 sm:pt-20"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-40 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]"
          aria-hidden
        />
        <PageContainer className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-eyebrow justify-center">Resume builder</p>
            <h1 className="mt-4 text-balance text-display text-foreground">{PRIMARY_HEADLINE}</h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-body-muted sm:text-lg">
              Build and preview for free. When your content and layout feel right, pay only to download
              your final PDF — no subscription, no surprise charges.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <TrackedLink
                href={ROUTES.create}
                cta="start_building"
                trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                )}
              >
                Start building free
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </TrackedLink>
              <TrackedLink
                href={ROUTES.templates}
                cta="view_templates"
                trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "border-border/80 bg-background/80 backdrop-blur-sm",
                )}
              >
                View templates
              </TrackedLink>
            </div>
            <ul className="trust-row mt-10 max-w-2xl mx-auto">
              <li>
                <CircleSlash2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>No subscription</span>
              </li>
              <li>
                <Lock className="size-4 shrink-0 text-brand" aria-hidden />
                <span>Stripe-secured checkout</span>
              </li>
              <li>
                <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>Mobile-friendly editor</span>
              </li>
              <li>
                <AlignLeft className="size-4 shrink-0 text-success" aria-hidden />
                <span>ATS-friendly formatting</span>
              </li>
            </ul>
          </div>
        </PageContainer>
      </MktSection>

      {/* 2. Product preview */}
      <MktSection id="preview" className="border-b border-border/40 bg-muted/15">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">What you get</p>
            <h2 className="mt-3 text-headline text-balance">A resume that looks finished — everywhere</h2>
            <p className="mt-3 text-body-muted">
              Polished layout in the editor, consistent on a phone screen and a desktop preview. The
              examples below are simplified mockups, not real data.
            </p>
          </div>
          <div className="mt-12">
            <HomeResumeShowcase />
          </div>
        </PageContainer>
      </MktSection>

      {/* 3. AI before / after */}
      <MktSection id="ai-example" className="border-b border-border/40">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">
              <Wand2 className="mb-0.5 inline size-3.5 align-middle" aria-hidden />
              {" "}Optional AI assist
            </p>
            <h2 className="mt-3 text-headline text-balance">Sharpen weak bullets — fast</h2>
            <p className="mt-3 text-body-muted">
              AI suggests tighter phrasing you can accept, edit, or ignore. Always verify facts and
              metrics; you are responsible for what you submit to employers.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 sm:gap-6">
            <article
              className="rounded-xl border border-border/80 bg-card p-5 text-left shadow-soft ring-1 ring-foreground/[0.04] sm:p-6"
              aria-labelledby="ai-before-heading"
            >
              <h3 id="ai-before-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Before
              </h3>
              <blockquote className="mt-3 border-l-2 border-muted-foreground/25 pl-4 text-sm leading-relaxed text-muted-foreground">
                <p>&ldquo;{aiBefore}&rdquo;</p>
              </blockquote>
            </article>
            <article
              className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 text-left shadow-soft ring-1 ring-primary/10 sm:p-6"
              aria-labelledby="ai-after-heading"
            >
              <h3 id="ai-after-heading" className="text-xs font-semibold uppercase tracking-wide text-brand">
                After
              </h3>
              <blockquote className="mt-3 border-l-2 border-brand/40 pl-4 text-sm font-medium leading-relaxed text-foreground">
                <p>&ldquo;{aiAfter}&rdquo;</p>
              </blockquote>
            </article>
          </div>
        </PageContainer>
      </MktSection>

      {/* 4. How it works */}
      <MktSection id="how-it-works" className="bg-muted/20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">How it works</p>
            <h2 className="mt-3 text-headline text-balance">From blank page to PDF in one flow</h2>
            <p className="mt-3 text-body-muted">
              No clutter — just the steps that move you toward a resume you are proud to send.
            </p>
          </div>
          <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {howItWorksSteps.map((step, i) => (
              <li
                key={step.title}
                className="relative flex flex-col rounded-xl border border-border/70 bg-card p-5 text-left shadow-soft ring-1 ring-foreground/[0.03] sm:p-6"
              >
                <span className="brand-mark !size-9 !text-sm" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-subhead">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
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
              Read the full walkthrough
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </PageContainer>
      </MktSection>

      {/* 5. Template quality */}
      <MktSection id="templates" className="border-b border-border/40">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Templates</p>
            <h2 className="mt-3 text-headline text-balance">Built for readability — and real screens</h2>
            <p className="mt-3 text-body-muted">
              Every template is tuned for legible type, sensible spacing, and sections recruiters expect.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3 sm:gap-5">
            {templateArchetypes.map((t) => (
              <li key={t.name}>
                <Card className="h-full border-border/70 shadow-soft ring-1 ring-foreground/[0.03]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{t.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{t.body}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center">
            <TrackedLink
              href={ROUTES.templates}
              cta="view_templates"
              trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
              className={cn(buttonVariants({ variant: "outline", size: "touch" }), "gap-2")}
            >
              Browse all templates
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </TrackedLink>
          </div>
        </PageContainer>
      </MktSection>

      {/* 6. Pricing teaser */}
      <MktSection id="pricing-teaser" className="bg-muted/25">
        <PageContainer>
          <div className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft sm:p-10">
            <p className="text-eyebrow justify-center">Pricing</p>
            <h2 className="mt-3 text-headline text-balance">Simple: preview free, pay to export</h2>
            <p className="mt-4 text-body-muted leading-relaxed">{PAY_ONCE_PDF_PER_PROJECT_LINE}</p>
            <ul className="mx-auto mt-6 max-w-md space-y-2.5 text-left text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>No subscription — checkout only when you want the PDF file.</span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>One unlock covers that resume project, including re-downloads after edits.</span>
              </li>
            </ul>
            <TrackedLink
              href={ROUTES.pricing}
              cta="view_pricing"
              trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
              className={cn(
                buttonVariants({ size: "touch" }),
                "mt-8 inline-flex w-full max-w-xs gap-2 bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
              )}
            >
              View pricing
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </TrackedLink>
          </div>
        </PageContainer>
      </MktSection>

      {/* 7. FAQ teaser */}
      <MktSection id="faq-teaser">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline">Common questions</h2>
            <p className="mt-2 text-body-muted">Straight answers — no fine print tricks.</p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl space-y-3">
            {faqTeaser.map((item) => (
              <section
                key={item.q}
                className="rounded-xl border border-border/80 bg-background px-4 py-4 text-left sm:px-5 sm:py-5"
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

      {/* 8. Final CTA */}
      <MktSection className="relative overflow-hidden border-t border-border/60 bg-aurora pb-20 pt-14 sm:pb-28 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]"
          aria-hidden
        />
        <PageContainer className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-[0.72rem] font-medium text-brand">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              Start in minutes
            </span>
            <h2 className="mt-6 text-balance text-display text-foreground">Start building your resume</h2>
            <p className="mt-4 text-body-muted">
              Open the editor on this device — free to draft and preview. Sign in when you want cloud
              save, optional AI, and PDF export.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.create}
                cta="start_building"
                trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
                )}
              >
                Start building free
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </TrackedLink>
              <TrackedLink
                href={ROUTES.templates}
                cta="view_templates"
                trackEvent={ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED}
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "bg-background/80")}
              >
                View templates
              </TrackedLink>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
