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
      <MktSection className="pt-12 sm:pt-20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Templates</p>
            <h1 className="mt-3 text-display text-balance">
              Clean layouts that <span className="text-gradient-brand">read well everywhere</span>
            </h1>
            <p className="mt-4 text-body-muted">
              Every layout prioritizes readable structure over decoration — so both humans and ATS
              tools can scan your experience quickly.
            </p>
          </div>

          <ul className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            {templates.map((t) => (
              <li key={t.name}>
                <Card interactive className="overflow-hidden">
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

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-10 md:grid-cols-2 md:gap-10">
            <div>
              <p className="text-eyebrow">Mobile &amp; desktop</p>
              <h2 className="mt-2 text-subhead">Edit anywhere, export anywhere</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tweak on your phone with large tap targets; settle in on desktop for long edits.
                Previews match exactly what employers will see in the PDF.
              </p>
            </div>
            <div>
              <p className="text-eyebrow">ATS-friendly</p>
              <h2 className="mt-2 text-subhead">Parsers actually read these</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No multi-column tricks or tiny footnotes. Conventional headings, predictable dates
                and titles — so automated screeners can map your history reliably.
              </p>
            </div>
            <div className="md:col-span-2">
              <Link
                href={ROUTES.auth.signup}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
                )}
              >
                Start with a template
              </Link>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
