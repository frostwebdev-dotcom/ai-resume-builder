import type { ReactNode } from "react";

/**
 * Studio route group: no marketing header/footer chrome.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col bg-background">{children}</div>;
}
