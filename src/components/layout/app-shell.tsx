"use client";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarToggleButton,
  SidebarVisibilityProvider,
  useSidebarVisibility,
} from "@/components/layout/sidebar-visibility";

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
 * Wraps the tree in a sidebar-visibility provider so a global keyboard
 * shortcut (Ctrl/Cmd + B) and a re-open handle can hide/show the sidebar.
 */
export function AppShell({ children, user }: AppShellProps) {
  return (
    <SidebarVisibilityProvider>
      <AppShellInner user={user}>{children}</AppShellInner>
    </SidebarVisibilityProvider>
  );
}

function AppShellInner({ children, user }: AppShellProps) {
  const { collapsed: isCollapsed } = useSidebarVisibility();
  return (
    <div className="relative flex min-h-0 flex-1">
      <AppSidebar user={user} />
      {isCollapsed ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 md:block"
          aria-hidden
        >
          {/* Re-open handle: lives on the far-left edge of the main column and
              is a forgiving click target for users who collapsed the sidebar
              and now want it back without reaching for the keyboard. */}
          <div className="pointer-events-auto absolute left-2 top-4">
            <SidebarToggleButton />
          </div>
        </div>
      ) : null}
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
