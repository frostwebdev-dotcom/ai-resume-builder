import type { ReactNode } from "react";

/**
 * Auth flows: no marketing chrome — centered card only.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh min-h-0 flex-1 flex-col bg-muted/20">{children}</div>
  );
}
