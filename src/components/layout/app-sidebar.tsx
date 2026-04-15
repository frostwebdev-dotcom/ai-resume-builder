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
    <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-border bg-card lg:w-60 lg:shrink-0 md:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href={ROUTES.app.root}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="App">
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
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <UserMenu email={user.email} isAdmin={user.isAdmin} />
      </div>
    </aside>
  );
}
