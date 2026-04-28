"use client";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppLoginPanelProvider } from "@/components/layout/app-login-panel";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarToggleButton,
  SidebarVisibilityProvider,
  useSidebarVisibility,
} from "@/components/layout/sidebar-visibility";
import { cn } from "@/lib/utils";

export type AppShellUser = {
  email: string;
  isAdmin: boolean;
};

type AppShellProps = {
  children: React.ReactNode;
  /** `null` = guest (e.g. dashboard preview from `/create`); signed-in areas still call `requireUser` per page. */
  user: AppShellUser | null;
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
  const guest = user === null;
  return (
    <AppLoginPanelProvider guest={guest}>
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
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
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            /* Reserve space for fixed desktop sidebar (width matches AppSidebar). */
            "transition-[padding] duration-200 ease-out",
            isCollapsed ? "md:pl-0" : "md:pl-[15.5rem] lg:pl-60",
          )}
        >
          <AppMobileHeader user={user} />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-auto scroll-pb-28 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:scroll-pb-0 md:pb-8">
            {children}
          </main>
          <AppBottomNav guest={guest} />
        </div>
      </div>
    </AppLoginPanelProvider>
  );
}
