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
    "Studio editor with structured sections, AI-assisted editing, and PDF export when you are ready — optimized for ATS and mobile.",
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
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow justify-center">How it works</p>
          <h1 className="mt-3 text-display text-balance">
            From blank page to <span className="text-gradient-brand">downloadable PDF</span>
          </h1>
          <p className="mt-4 text-body-muted">
            A focused flow built for speed and clarity — not feature bloat.
          </p>
        </div>

        <ol className="mx-auto mt-16 max-w-3xl">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-5 pb-10 sm:gap-7 sm:pb-12 last:pb-0"
            >
              {i < steps.length - 1 ? (
                <span
                  className="absolute left-[1.375rem] top-12 bottom-0 w-px bg-gradient-to-b from-border to-transparent sm:left-[1.625rem]"
                  aria-hidden
                />
              ) : null}
              <span
                className="brand-mark !size-11 shrink-0 !text-base sm:!size-12 sm:!text-lg"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="pt-1">
                <h2 className="text-subhead">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-14 flex max-w-3xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-start">
          <Link
            href={ROUTES.auth.login}
            className={cn(
              buttonVariants({ size: "touch" }),
              "bg-brand text-brand-foreground hover:bg-brand/90",
            )}
          >
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
