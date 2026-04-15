"use client";

import Link from "next/link";

import { UserMenu } from "@/components/auth/user-menu";
import type { AppShellUser } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

type AppMobileHeaderProps = {
  title?: string;
  showBack?: boolean;
  user: AppShellUser;
};

/**
 * Sticky top bar for small screens — large tap targets, clear title.
 */
export function AppMobileHeader({
  title = APP_NAME,
  showBack = false,
  user,
}: AppMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/90 md:hidden">
      <div className="grid h-14 min-h-14 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2 pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))]">
        <div className="flex justify-start">
          {showBack ? (
            <Link
              href={ROUTES.app.root}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-3",
              )}
            >
              ← Back
            </Link>
          ) : null}
        </div>
        <h1 className="min-w-0 truncate text-center text-base font-semibold leading-tight">
          {title}
        </h1>
        <div className="flex justify-end">
          <UserMenu email={user.email} isAdmin={user.isAdmin} variant="icon" />
        </div>
      </div>
    </header>
  );
}
