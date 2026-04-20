import type { ReactNode } from "react";

/**
 * Studio route group: no marketing header/footer chrome.
 *
 * Locks the layout to the viewport (`100dvh` + `overflow-hidden`) so the
 * builder never spawns outer page scroll. Only inner panels scroll.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden overscroll-none bg-slate-50">
      {children}
    </div>
  );
}
