import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { PageContainer } from "@/components/layout/page-container";
import { APP_NAME, ROUTES } from "@/lib/constants";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <PageContainer className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-sm font-semibold">Admin</span>
            <span className="text-muted-foreground">·</span>
            <Link
              href={ROUTES.home}
              className="min-w-0 truncate text-sm text-muted-foreground hover:text-foreground"
            >
              {APP_NAME}
            </Link>
          </div>
          <Link
            href={ROUTES.app.root}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
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
