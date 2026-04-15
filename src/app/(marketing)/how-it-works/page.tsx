import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Step-by-step: structured prompts, AI-assisted editing, and PDF export when you are ready — optimized for ATS and mobile.",
};

const steps = [
  {
    title: "Create a project",
    body: "Start with your target role. We scaffold standard sections (summary, experience, education, skills) so parsers and recruiters see a familiar structure.",
  },
  {
    title: "Fill and refine",
    body: "Type naturally or use AI to tighten bullets. Every suggestion stays editable — you approve what ships.",
  },
  {
    title: "Preview everywhere",
    body: "Check layout on a phone and a desktop. Typography and spacing stay readable so you are confident before checkout.",
  },
  {
    title: "Pay to export",
    body: "When the content feels right, unlock a high-quality PDF. No subscription — just a clear one-time purchase at export.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-display text-balance">How it works</h1>
          <p className="mt-3 text-body-muted">
            A focused flow from blank page to downloadable PDF — built for speed and clarity, not
            feature bloat.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl space-y-10">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 sm:gap-6">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h2 className="text-subhead">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-14 flex max-w-3xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-start">
          <Link href={ROUTES.auth.signup} className={cn(buttonVariants({ size: "touch" }))}>
            Start free
          </Link>
          <Link
            href={ROUTES.templates}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
          >
            See templates
          </Link>
        </div>
      </PageContainer>
    </MktSection>
  );
}
