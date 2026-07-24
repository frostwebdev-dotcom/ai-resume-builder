import type { Metadata } from "next";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleSlash2,
  FileText,
  LayoutTemplate,
  PenLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react";

import { HomepageSectionViewTracker } from "@/components/analytics/homepage-section-view-tracker";
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
  RESUME_PDF_EXPORT_PRICE_USD,
} from "@/lib/billing/monetization-copy";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { APP_NAME, ROUTES } from "@/lib/constants";

const PRIMARY_HEADLINE = "Create a professional resume that is ready to send";

export const metadata: Metadata = {
  title: PRIMARY_HEADLINE,
  description:
    "Build and preview your resume for free. Use optional AI to tighten your wording, pick a professional template, then pay only when you download your final PDF — no subscription.",
  openGraph: {
    title: `${APP_NAME} — ${PRIMARY_HEADLINE}`,
    description:
      "Build and preview for free. Improve your content with AI, then pay once only when you are ready to download.",
  },
};

const trustPoints = [
  {
    label: "No subscription",
    icon: CircleSlash2,
  },
  {
    label: "Secure checkout",
    icon: ShieldCheck,
  },
  {
    label: "Build on your phone",
    icon: Smartphone,
  },
  {
    label: "ATS-friendly formatting",
    icon: AlignLeft,
  },
] as const;

const howItWorksSteps = [
  {
    title: "Add your experience",
    body: "Enter your work, education, and skills in guided sections.",
    icon: PenLine,
  },
  {
    title: "Improve your content with AI",
    body: "Review suggested wording before it goes into your resume.",
    icon: BrainCircuit,
  },
  {
    title: "Choose a professional template",
    body: "Preview clean layouts designed for recruiter readability.",
    icon: LayoutTemplate,
  },
  {
    title: "Pay once and download your PDF",
    body: "Export only when the final version is ready.",
    icon: FileText,
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
  "Improved website functionality by resolving UI issues and supporting frontend enhancements across key pages.";

function HeroResumePreview() {
  return (
    <div className="mx-auto w-full max-w-[22rem] lg:max-w-md">
      <HomepageSectionViewTracker
        event={ANALYTICS_EVENTS.HOMEPAGE_PREVIEW_VIEWED}
        section="hero_resume_preview"
      />
      <div className="rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-3 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] ring-1 ring-slate-950/5 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Professional ATS Template
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A clean, recruiter-friendly layout designed for readability and professional presentation.
            </p>
          </div>
          <BadgeCheck className="size-8 shrink-0 text-brand" aria-hidden />
        </div>
        <div
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
          role="img"
          aria-label="Sample professional resume preview with placeholder content."
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-lg font-semibold tracking-tight">Avery Morgan</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Operations Coordinator
            </p>
          </div>
          <div className="space-y-4 px-5 py-4 text-left">
            <section>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Summary
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                Detail-oriented coordinator with experience improving team workflows, customer communication,
                and day-to-day operations.
              </p>
            </section>
            <section>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Experience
              </p>
              <div className="mt-2 border-l-2 border-brand/30 pl-3">
                <p className="text-sm font-semibold">Project Assistant</p>
                <p className="text-[0.7rem] text-slate-500">Sample Company · 2021–2024</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700">
                  <li>Improved weekly reporting accuracy by organizing project updates and timelines.</li>
                  <li>Supported customer-facing teams with clear documentation and follow-up tracking.</li>
                </ul>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <section className="rounded-xl bg-slate-50 p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Skills
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                  Scheduling · Reporting · CRM
                </p>
              </section>
              <section className="rounded-xl bg-slate-50 p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Education
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">B.A. Business</p>
              </section>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["ATS-friendly", "PDF-ready", "Professional layout"].map((badge) => (
            <span
              key={badge}
              className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        Sample preview shown for demonstration.
      </p>
    </div>
  );
}

export default function MarketingHomePage() {
  return (
    <>
      <HomeJsonLd />

      {/* 1. Hero */}
      <MktSection
        id="top"
        className="relative overflow-hidden border-b border-border/60 bg-aurora pb-9 pt-8 sm:pb-16 sm:pt-16 lg:pb-20"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-40 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]"
          aria-hidden
        />
        <PageContainer className="relative">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <p className="text-eyebrow justify-center lg:justify-start">AI resume builder</p>
              <h1 className="mt-4 text-balance text-display text-foreground">{PRIMARY_HEADLINE}</h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-body-muted sm:text-lg lg:mx-0">
                Create and preview your resume for free. Improve your content with AI, then pay once only
                when you are ready to download the final PDF.
              </p>
              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <TrackedLink
                  href={ROUTES.templates}
                  cta="choose_template"
                  trackEvents={[
                    ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                    ANALYTICS_EVENTS.HOMEPAGE_PRIMARY_CTA_CLICKED,
                    ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
                  ]}
                  className={cn(
                    buttonVariants({ size: "touch" }),
                    "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90 sm:w-auto",
                  )}
                >
                  Build my resume free
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </TrackedLink>
                <TrackedLink
                  href={ROUTES.templates}
                  cta="view_templates"
                  trackEvents={[
                    ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                    ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
                  ]}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "touch" }),
                    "w-full border-border/80 bg-background/80 backdrop-blur-sm sm:w-auto",
                  )}
                >
                  View templates
                </TrackedLink>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Preview free. Pay once only when you are ready to download.
              </p>
              <ul className="mx-auto mt-5 grid max-w-xl grid-cols-2 gap-2.5 rounded-2xl border border-border/70 bg-background/75 p-3 text-left shadow-soft backdrop-blur-sm lg:mx-0">
                {trustPoints.map(({ label, icon: Icon }) => (
                  <li key={label} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-foreground">
                    <Icon className="size-4 shrink-0 text-brand" aria-hidden />
                    <span className="leading-tight">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <HeroResumePreview />
          </div>
        </PageContainer>
      </MktSection>

      {/* 2. AI before / after */}
      <MktSection id="ai-example" className="border-b border-border/40 bg-background py-12 sm:py-16">
        <PageContainer>
          <HomepageSectionViewTracker
            event={ANALYTICS_EVENTS.HOMEPAGE_AI_EXAMPLE_VIEWED}
            section="ai_example"
          />
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">
              <Wand2 className="mb-0.5 inline size-3.5 align-middle" aria-hidden />
              {" "}AI-assisted resume writing
            </p>
            <h2 className="mt-3 text-headline text-balance">Improve your resume with AI</h2>
            <p className="mt-3 text-body-muted">
              Turn simple experience notes into professional resume language while keeping your
              information accurate.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 sm:gap-6">
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
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
            AI suggestions require your approval before being added to your resume.
          </p>
        </PageContainer>
      </MktSection>

      {/* 3. Professional output */}
      <MktSection id="preview" className="border-b border-border/40 bg-muted/15 py-12 sm:py-16">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Professional output</p>
            <h2 className="mt-3 text-headline text-balance">A resume that looks ready to send</h2>
            <p className="mt-3 text-body-muted">
              Choose a clean, ATS-friendly template and see your resume update as you build.
              Your final PDF keeps the same professional layout.
            </p>
          </div>
          <div className="mt-8 sm:mt-10">
            <HomeResumeShowcase />
          </div>
        </PageContainer>
      </MktSection>

      {/* 4. How it works */}
      <MktSection id="how-it-works" className="bg-muted/20 py-12 sm:py-16">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">How it works</p>
            <h2 className="mt-3 text-headline text-balance">From first draft to final PDF</h2>
            <p className="mt-3 text-body-muted">
              A simple flow built around creating first and paying only when you are ready to download.
            </p>
          </div>
          <ol className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {howItWorksSteps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative flex gap-3 rounded-xl border border-border/70 bg-card p-4 text-left shadow-soft ring-1 ring-foreground/[0.03] sm:flex-col sm:p-5"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand" aria-hidden>
                    <StepIcon className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-1 text-subhead">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              );
            })}
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
              trackEvents={[
                ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
              ]}
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
            <h2 className="mt-3 text-headline text-balance">Start free. Pay only when ready.</h2>
            <p className="mt-4 text-body-muted leading-relaxed">
              Preview free. Pay once only when you are ready to download.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-2.5 text-left text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>
                  <strong className="font-medium text-foreground">Build and preview:</strong> Free
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>
                  <strong className="font-medium text-foreground">PDF download:</strong>{" "}
                  {RESUME_PDF_EXPORT_PRICE_USD} one-time unlock per resume project
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>
                  <strong className="font-medium text-foreground">Subscription:</strong> None at launch
                </span>
              </li>
            </ul>
            <TrackedLink
              href={ROUTES.templates}
              cta="choose_template"
              trackEvents={[
                ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                ANALYTICS_EVENTS.HOMEPAGE_PRIMARY_CTA_CLICKED,
                ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
              ]}
              className={cn(
                buttonVariants({ size: "touch" }),
                "mt-8 inline-flex w-full max-w-xs gap-2 bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
              )}
            >
              Start building free
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
            <h2 className="mt-6 text-balance text-display text-foreground">Ready to create your resume?</h2>
            <p className="mt-4 text-body-muted">
              Start free and pay only when your final PDF is ready to download.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                href={ROUTES.templates}
                cta="choose_template"
                trackEvents={[
                  ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                  ANALYTICS_EVENTS.HOMEPAGE_PRIMARY_CTA_CLICKED,
                  ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
                ]}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90 sm:w-auto",
                )}
              >
                Build my resume free
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </TrackedLink>
              <TrackedLink
                href={ROUTES.templates}
                cta="view_templates"
                trackEvents={[
                  ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED,
                  ANALYTICS_EVENTS.HOMEPAGE_TEMPLATES_CLICKED,
                ]}
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "w-full bg-background/80 sm:w-auto")}
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
