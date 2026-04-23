import type { Metadata } from "next";
import Link from "next/link";

import { GuestAppRouteBanner } from "@/components/layout/guest-app-route-banner";
import { PageContainer } from "@/components/layout/page-container";
import { TemplatesCatalog } from "@/components/templates/templates-catalog";
import { buttonVariants } from "@/components/ui/button";
import { getOptionalAuth } from "@/lib/auth/guards";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Pick a resume template to start a project, edit in the studio, and change the layout any time. Export from Preview when you are ready.",
};

export default async function AppTemplatesPage() {
  const ctx = await getOptionalAuth();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
        <PageContainer>
          {!ctx ? (
            <GuestAppRouteBanner nextPath={ROUTES.app.templates}>
              You&apos;re browsing as a guest. Saved projects and template picks sync after you sign in. Start a draft on{" "}
              <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.create}>
                Create
              </Link>{" "}
              anytime.
            </GuestAppRouteBanner>
          ) : null}

          <header className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Templates</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Resume templates
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Search and filter below, then click a card to start with that layout (or use the magnifier to preview).
              In the studio you can{" "}
              <span className="font-medium text-slate-800">switch templates any time</span> from the template strip
              beside the live preview. Export when you are ready from{" "}
              <span className="font-medium text-slate-800">Preview &amp; export</span>.
            </p>
          </header>

          <TemplatesCatalog surface="app" guest={!ctx} className="mx-auto mt-8 max-w-6xl" />

          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm text-slate-600">
              {ctx
                ? "Prefer a blank start? Create a draft with the default template, then pick another look from the studio."
                : "Guests: each card opens the public builder with that template. Sign in to save projects to your account."}
            </p>
            <Link
              href={ROUTES.create}
              className={cn(
                buttonVariants({ size: "default" }),
                "h-10 rounded-full bg-[#2268d7] px-6 text-sm font-semibold text-white hover:bg-[#1a56b8]",
              )}
            >
              Create a resume
            </Link>
            <Link
              href={ROUTES.templates}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Open public templates page
            </Link>
          </div>
        </PageContainer>
      </div>
    </section>
  );
}
