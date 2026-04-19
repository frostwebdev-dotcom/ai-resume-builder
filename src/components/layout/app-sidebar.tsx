"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRound } from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import type { AppShellUser } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

const items = [
  { href: ROUTES.app.root, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.app.account, label: "Account", icon: UserRound },
] as const;

type AppSidebarProps = {
  user: AppShellUser;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex",
        "sticky top-0 z-20 self-start h-screen max-h-screen",
        "w-[15.5rem] shrink-0 flex-col overflow-y-auto",
        "border-r border-border/70 bg-card/80 backdrop-blur-sm supports-[backdrop-filter]:bg-card/60",
        "[scrollbar-gutter:stable] lg:w-60",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex h-14 items-center border-b border-border/70 px-4">
        <Link
          href={ROUTES.app.root}
          aria-label={`${APP_NAME} — dashboard`}
          className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <span className="brand-mark" aria-hidden>
            R
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </span>
        </Link>
      </div>
      <p className="px-4 pt-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
        Workspace
      </p>
      <nav className="flex flex-1 flex-col gap-0.5 p-3 pt-2" aria-label="App">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === ROUTES.app.root
              ? pathname === ROUTES.app.root ||
                pathname.startsWith("/app/projects/")
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-brand"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-brand" : "opacity-80",
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 p-3">
        <UserMenu email={user.email} isAdmin={user.isAdmin} />
      </div>
    </aside>
  );
}
