import { Suspense } from "react";

import { TemplatesLaunchGrid } from "@/components/templates/templates-launch-grid";

type Props = {
  /** Extra classes on the grid root (layout, max-width, spacing). */
  className?: string;
};

function GridFallback() {
  return (
    <div className="grid grid-cols-1 gap-5 animate-pulse lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[400px] rounded-2xl bg-slate-200/60" />
      ))}
    </div>
  );
}

/**
 * Marketing embed — three launch templates with preview and CTAs.
 */
export function TemplatesThemeGrid({ className }: Props) {
  return (
    <Suspense fallback={<GridFallback />}>
      <TemplatesLaunchGrid guest signedIn={false} className={className} />
    </Suspense>
  );
}
