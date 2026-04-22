import type { ReactNode } from "react";

import { STUDIO_VIEWPORT_ROOT_CLASS } from "@/lib/studio-viewport";

/**
 * Studio route group: no marketing header/footer chrome.
 *
 * Locks the layout to the viewport (`100dvh` + `overflow-hidden`) so the
 * builder never spawns outer page scroll. Only inner panels scroll.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className={STUDIO_VIEWPORT_ROOT_CLASS}>{children}</div>;
}
