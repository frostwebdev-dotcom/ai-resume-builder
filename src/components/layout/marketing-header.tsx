import Link from "next/link";

import {
  MarketingAuthLinks,
  MarketingPrimaryNav,
} from "@/components/layout/marketing-header-nav";
import { pageGutterXClass } from "@/components/layout/page-container";
import { getOptionalAuth } from "@/lib/auth/guards";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function MarketingHeader() {
  const ctx = await getOptionalAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div
        className={cn(
          "mx-auto flex h-14 min-h-14 w-full min-w-0 max-w-6xl items-center gap-2 sm:gap-4",
          pageGutterXClass,
        )}
      >
        <Link
          href={ROUTES.home}
          aria-label={`${APP_NAME} — home`}
          className="group flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-ring sm:gap-2.5"
        >
          <span className="brand-mark" aria-hidden>
            S
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold tracking-tight">
              <span className="sm:hidden">BuildResume</span>
              <span className="hidden sm:inline">
                {APP_NAME}
              </span>
            </span>
            <span className="mt-0.5 hidden text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              AI-assisted · ATS-friendly
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <MarketingPrimaryNav />
        </div>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <MarketingAuthLinks
            isAuthed={Boolean(ctx)}
            userEmail={ctx?.user.email ?? null}
            isAdmin={ctx?.profile.role === "admin"}
          />
        </div>
      </div>
    </header>
  );
}
