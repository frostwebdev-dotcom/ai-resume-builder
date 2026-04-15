import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
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
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Resume templates",
  description:
    "ATS-friendly resume templates with clean previews. Optimized for mobile editing and desktop PDF export.",
};

const templates = [
  {
    name: "Classic",
    description: "Single-column layout, strong hierarchy, safe for most ATS parsers.",
    variant: "classic" as const,
  },
  {
    name: "Modern",
    description: "Subtle emphasis blocks for tech and product roles — still parser-friendly.",
    variant: "modern" as const,
  },
  {
    name: "Compact",
    description: "Tighter spacing for dense careers — best reviewed on desktop before export.",
    variant: "classic" as const,
  },
] as const;

export default function TemplatesPage() {
  return (
    <>
      <MktSection className="pt-10 sm:pt-14">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-display text-balance">Resume templates</h1>
            <p className="mt-3 text-body-muted">
              Every layout prioritizes readable structure over decoration — so both humans and ATS
              tools can scan your experience quickly.
            </p>
          </div>

          <ul className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {templates.map((t) => (
              <li key={t.name}>
                <Card className="overflow-hidden border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResumePreviewMock variant={t.variant} />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
            <h2 className="text-subhead">Mobile and desktop</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Edit on your phone when you need to — buttons and fields use large tap targets. For long
              editing sessions, desktop still shines: you will preview the same PDF employers see.
            </p>
            <h2 className="mt-8 text-subhead">ATS-friendly approach</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We avoid multi-column tricks and tiny footnotes that confuse parsers. Headings follow
              conventional names; dates and titles stay in predictable positions so automated screeners
              can map your history.
            </p>
            <div className="mt-8">
              <Link href={ROUTES.auth.signup} className={cn(buttonVariants({ size: "touch" }))}>
                Start with a template
              </Link>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
