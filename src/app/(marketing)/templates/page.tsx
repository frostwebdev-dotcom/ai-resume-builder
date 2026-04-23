import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { TemplatesCatalog } from "@/components/templates/templates-catalog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Browse ATS-friendly resume templates. After you create a project, open Preview & export in that project to apply a template and export a PDF.",
};

export default function TemplatesPage() {
  return (
    <>
      <MktSection className="pt-12 sm:pt-20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Templates</p>
            <h1 className="mt-3 text-display text-balance">
              Resume templates
            </h1>
            <p className="mt-4 text-body-muted">
              ATS-friendly layouts built for readability. Browse and preview here, then—after you create a
              project—open <span className="font-medium text-foreground/90">Preview &amp; export</span> on
              that project to apply a template and continue to PDF export.
            </p>
          </div>

          <TemplatesCatalog surface="marketing" className="mx-auto mt-10 max-w-6xl" />

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-10 md:grid-cols-2 md:gap-10">
            <div>
              <p className="text-eyebrow">Mobile &amp; desktop</p>
              <h2 className="mt-2 text-subhead">Draft anywhere, export anywhere</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tweak on your phone with large tap targets; settle in on desktop for long edits.
                Preview matches what you get after export.
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
                href={ROUTES.auth.login}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
                )}
              >
                Sign in to create a project
              </Link>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
