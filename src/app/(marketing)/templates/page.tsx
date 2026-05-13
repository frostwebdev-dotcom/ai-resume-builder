import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { TemplatesLaunchGrid } from "@/components/templates/templates-launch-grid";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Three curated, ATS-friendly resume templates. Pick one, preview with sample content, then start building — your wording stays when you switch layouts.",
};

function TemplatesGridFallback() {
  return (
    <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-5 animate-pulse lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[420px] rounded-2xl bg-slate-200/60" />
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <>
      <MktSection className="pt-12 sm:pt-20">
        <PageContainer className="max-w-[min(100%,90rem)]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow justify-center">Templates</p>
            <h1 className="mt-3 text-display text-balance">Pick a layout you trust</h1>
            <p className="mt-4 text-body-muted">
              Three launch templates — each tuned for readability, mobile editing, and PDF export that matches your
              preview. Choose one to start; you can switch later without losing your content.
            </p>
          </div>

          <Suspense fallback={<TemplatesGridFallback />}>
            <TemplatesLaunchGrid guest className="mx-auto mt-10 max-w-6xl" />
          </Suspense>

          <div className="mx-auto mt-14 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card px-6 py-8 text-center shadow-soft sm:px-10">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ready to write? Open the builder with your chosen look, or sign in first to save projects to your account.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={ROUTES.create}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto",
                )}
              >
                Start without signing in
              </Link>
              <Link
                href={ROUTES.auth.login}
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), "w-full sm:w-auto")}
              >
                Sign in first
              </Link>
            </div>
          </div>
        </PageContainer>
      </MktSection>
    </>
  );
}
