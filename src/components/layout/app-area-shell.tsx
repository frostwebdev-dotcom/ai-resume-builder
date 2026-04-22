"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell, type AppShellUser } from "@/components/layout/app-shell";
import { STUDIO_VIEWPORT_ROOT_CLASS } from "@/lib/studio-viewport";

function isProjectBuildPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/app\/projects\/[^/]+\/build\/?$/.test(pathname);
}

/**
 * Authenticated `/app/*` tree: normal pages use {@link AppShell}; project draft
 * (`/app/projects/:id/build`) uses the same fixed full-viewport shell as public `/create`.
 */
export function AppAreaShell({
  user,
  children,
}: {
  user: AppShellUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (isProjectBuildPath(pathname)) {
    return <div className={STUDIO_VIEWPORT_ROOT_CLASS}>{children}</div>;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
