import Link from "next/link";
import { Construction, FileText, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

const copy = {
  jobs: {
    title: "Job search",
    lead: "Real job listings and saved searches are not part of this release.",
    body: `${APP_NAME} is focused on resume editing, live preview, checkout, and PDF export. Integrated job search may ship in a future update.`,
  },
  applications: {
    title: "Application tracking",
    lead: "A persisted application pipeline is not part of this release.",
    body: `When this ships, you will be able to track statuses and next steps alongside your resumes. For now, use your resumes list to open projects, continue drafts, and export PDFs.`,
  },
} as const;

type Props = {
  feature: keyof typeof copy;
  guest?: boolean;
};

export function WorkspaceFeatureComingSoon({ feature, guest = false }: Props) {
  const c = copy[feature];

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto pb-10 pt-6 sm:pb-12 sm:pt-8">
        <PageContainer>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <Construction className="size-4 text-amber-600" aria-hidden />
            Coming soon
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{c.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{c.lead}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{c.body}</p>

          {guest ? (
            <p className="mt-4 max-w-2xl text-sm text-slate-600">
              <Link
                href={ROUTES.auth.login}
                className="font-semibold text-[#2268d7] underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to save resume projects to your account, or keep drafting in the{" "}
              <Link href={ROUTES.create} className="font-medium text-[#2268d7] underline-offset-2 hover:underline">
                resume builder
              </Link>
              .
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ROUTES.app.resumes}
              className={cn(
                buttonVariants({ size: "default" }),
                "inline-flex h-11 items-center gap-2 rounded-full bg-[#2268d7] px-6 text-sm font-semibold text-white hover:bg-[#1a56b8]",
              )}
            >
              <FileText className="size-4" aria-hidden />
              Go to resumes
            </Link>
            <Link
              href={ROUTES.create}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "inline-flex h-11 items-center gap-2 rounded-full border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 hover:bg-slate-50",
              )}
            >
              <Plus className="size-4" aria-hidden />
              Open resume builder
            </Link>
          </div>
        </PageContainer>
      </div>
    </section>
  );
}
