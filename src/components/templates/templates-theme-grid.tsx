import { Suspense } from "react";

import { TemplatesLaunchGrid } from "@/components/templates/templates-launch-grid";

type Props = {
  /** Extra classes on the grid root (layout, max-width, spacing). */
  className?: string;
};

function GridFallback() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-[280px] rounded-xl bg-slate-200/60" />
      ))}
    </div>
  );
}

/**
 * Marketing embed — launch templates grid with preview and CTAs (used where a compact grid is preferred).
 */
export function TemplatesThemeGrid({ className }: Props) {
  return (
    <Suspense fallback={<GridFallback />}>
      <TemplatesLaunchGrid guest signedIn={false} className={className} />
    </Suspense>
  );
}
