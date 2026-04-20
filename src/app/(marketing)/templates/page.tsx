import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
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
import { ALL_TEMPLATE_THEMES } from "@/lib/resume-preview/template-theme";

export const metadata: Metadata = {
  title: "Resume templates",
  description:
    "Forty ATS-friendly resume templates with clean previews. Pick a layout that matches your industry and goals.",
};

export default function TemplatesPage() {
  return (
    <>
      <MktSection className="pt-12 sm:pt-20">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Templates</p>
            <h1 className="mt-3 text-display text-balance">
              Forty professional layouts that <span className="text-gradient-brand">read well everywhere</span>
            </h1>
            <p className="mt-4 text-body-muted">
              Every layout prioritizes readable structure over decoration — so both humans and ATS
              tools can scan your experience quickly. Switch between them at any time from your project preview.
            </p>
          </div>

          <ul className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ALL_TEMPLATE_THEMES.map((theme) => (
              <li key={theme.slug}>
                <Card interactive className="h-full overflow-hidden">
                  <CardContent className="pt-5">
                    <div
                      className="overflow-hidden rounded-md ring-1 ring-border/60"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
                      }}
                    >
                      <div className="p-2">
                        <TemplateThumbnail slug={theme.slug} />
                      </div>
                    </div>
                  </CardContent>
                  <CardHeader className="pt-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="inline-block size-2.5 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: theme.accent }}
                        aria-hidden
                      />
                      {theme.name}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {theme.pickerTagline}
                    </CardDescription>
                    <p className="mt-1 text-caption text-muted-foreground/80">
                      {theme.bestFor}
                    </p>
                  </CardHeader>
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
                href={ROUTES.auth.login}
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
