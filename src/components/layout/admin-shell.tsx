import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { PageContainer } from "@/components/layout/page-container";
import { APP_NAME, ROUTES } from "@/lib/constants";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <PageContainer className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-muted px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand ring-1 ring-brand/20"
              aria-label="Admin area"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Admin
            </span>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <Link
              href={ROUTES.home}
              className="hidden min-w-0 truncate text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {APP_NAME}
            </Link>
          </div>
          <Link
            href={ROUTES.app.root}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to app
          </Link>
        </PageContainer>
        <PageContainer className="flex flex-col gap-3 border-t border-border/60 py-3 sm:py-4">
          <AdminNav />
        </PageContainer>
      </header>
      <main className="min-h-0 flex-1 py-6 sm:py-8">
        <PageContainer className="max-w-7xl">{children}</PageContainer>
      </main>
    </div>
  );
}
