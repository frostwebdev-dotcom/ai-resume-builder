"use client";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export type AppShellUser = {
  email: string;
  isAdmin: boolean;
};

type AppShellProps = {
  children: React.ReactNode;
  user: AppShellUser;
};

/**
 * Authenticated product shell: desktop sidebar + mobile header & bottom nav.
 */
export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <AppSidebar user={user} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppMobileHeader user={user} />
        <main className="min-h-0 flex-1 scroll-pb-28 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:scroll-pb-0 md:pb-8">
          {children}
        </main>
        <AppBottomNav />
      </div>
    </div>
  );
}
