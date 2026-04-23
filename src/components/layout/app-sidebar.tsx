"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Plus, UserRound } from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import type { AppShellUser } from "@/components/layout/app-shell";
import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import {
  SidebarToggleButton,
  useSidebarVisibility,
} from "@/components/layout/sidebar-visibility";
import {
  DASHBOARD_NAV_DESKTOP,
  dashboardSidebarActive,
} from "@/components/projects/dashboard-workspace-grid";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

type AppSidebarProps = {
  user: AppShellUser | null;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { collapsed: isCollapsed } = useSidebarVisibility();
  const { openLogin } = useAppLoginPanel();

  return (
    <aside
      className={cn(
        "hidden md:flex",
        "sticky top-0 z-20 self-start h-screen max-h-screen",
        "shrink-0 flex-col overflow-hidden",
        "bg-[#1c1f26] text-zinc-100 shadow-[4px_0_24px_rgba(0,0,0,0.12)]",
        "[scrollbar-gutter:stable]",
        "transition-[width] duration-200 ease-out",
        isCollapsed ? "w-0" : "w-[15.5rem] lg:w-60",
      )}
      aria-label="Primary navigation"
      aria-hidden={isCollapsed}
      inert={isCollapsed || undefined}
    >
      <div className="flex h-full w-[15.5rem] flex-col lg:w-60">
        <div className="flex h-14 items-center justify-between gap-2 px-4 pr-2 pt-[max(0.25rem,env(safe-area-inset-top,0px))]">
          <Link
            href={ROUTES.home}
            aria-label={`${APP_NAME} — home`}
            className="group flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold tracking-tight text-white ring-1 ring-white/15"
              aria-hidden
            >
              S
            </span>
            <span className="line-clamp-2 text-left text-[0.7rem] font-semibold leading-snug tracking-tight text-white sm:text-xs">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href={ROUTES.faq}
              className="inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Help and FAQ"
            >
              <CircleHelp className="size-4" aria-hidden />
            </Link>
            <SidebarToggleButton className="text-zinc-400 hover:bg-white/10 hover:text-white" />
          </div>
        </div>

        <div className="px-3 pb-2">
          <Link
            href={ROUTES.create}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/35 bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Plus className="size-4" aria-hidden />
            New
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-2 pb-3 pt-1">
          {DASHBOARD_NAV_DESKTOP.map(({ href, label, icon: Icon }) => {
            const active = dashboardSidebarActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/12 text-white"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-white" : "opacity-85",
                  )}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {user ? (
            <UserMenu email={user.email} isAdmin={user.isAdmin} tone="inverse" />
          ) : (
            <button
              type="button"
              onClick={() => openLogin(ROUTES.app.root)}
              aria-label="Log in to your account"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
            >
              <UserRound className="size-4 shrink-0 opacity-90" aria-hidden />
              Log in
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
