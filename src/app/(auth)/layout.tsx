import type { ReactNode } from "react";

/**
 * Auth flows: no marketing chrome — centered card only.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh min-h-0 flex-1 flex-col bg-aurora">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-25 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]"
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
