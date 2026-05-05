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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div
        className={cn(
          "mx-auto flex h-14 min-h-14 w-full min-w-0 max-w-6xl items-center gap-2 sm:gap-4",
          pageGutterXClass,
        )}
      >
        <Link
          href={ROUTES.home}
          aria-label={`${APP_NAME} — home`}
          className="group flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <span className="brand-mark" aria-hidden>
            S
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">
              {APP_NAME}
            </span>
            <span className="mt-0.5 hidden text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              ATS-friendly · Pay on export
            </span>
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <MarketingPrimaryNav />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
