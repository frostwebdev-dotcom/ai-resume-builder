import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { GuestAppRouteBanner } from "@/components/layout/guest-app-route-banner";
import { PageContainer } from "@/components/layout/page-container";
import { TemplatesLaunchGrid } from "@/components/templates/templates-launch-grid";
import { buttonVariants } from "@/components/ui/button";
import { getOptionalAuth } from "@/lib/auth/guards";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Pick a resume template to start a project. Preview with sample content, then edit in the studio — switching templates updates layout only.",
};

function TemplatesGridFallback() {
  return (
    <div className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-1 gap-5 animate-pulse lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[420px] rounded-2xl bg-slate-200/60" />
      ))}
    </div>
  );
}

export default async function AppTemplatesPage() {
  const ctx = await getOptionalAuth();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto pb-10 pt-6 sm:pb-12 sm:pt-8">
        <PageContainer className="max-w-[min(100%,90rem)]">
          {!ctx ? (
            <GuestAppRouteBanner nextPath={ROUTES.app.templates}>
              You&apos;re browsing as a guest. Saved projects and template picks sync after you sign in. Start a draft
              on{" "}
              <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.create}>
                Create
              </Link>{" "}
              anytime.
            </GuestAppRouteBanner>
          ) : null}

          <header className="min-w-0 border-b border-slate-200/90 pb-5 sm:pb-6">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Templates</p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Choose a launch template
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
              Preview sample résumés, compare layouts, then start with{" "}
              <span className="font-medium text-slate-800">Use this template</span>. In the studio you can switch
              anytime — only styling changes. Export from{" "}
              <span className="font-medium text-slate-800">Preview &amp; export</span>.
            </p>
          </header>

          <Suspense fallback={<TemplatesGridFallback />}>
            <TemplatesLaunchGrid guest={!ctx} signedIn={Boolean(ctx)} className="mx-auto mt-6 max-w-6xl" />
          </Suspense>

          <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm text-slate-600">
              {ctx
                ? "Prefer a blank start? Open Create with the default template, then pick another look from the studio strip."
                : "Guests: each template opens the public builder with that layout pre-selected."}
            </p>
            <Link
              href={ROUTES.create}
              className={cn(
                buttonVariants({ size: "touch" }),
                "w-full rounded-full bg-[#2268d7] px-6 text-sm font-semibold text-white hover:bg-[#1a56b8] sm:w-auto",
              )}
            >
              Open Create
            </Link>
            <Link
              href={ROUTES.templates}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Public templates page
            </Link>
          </div>
        </PageContainer>
      </div>
    </section>
  );
}
