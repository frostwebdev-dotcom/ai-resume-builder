import { Suspense } from "react";

import { TemplatesLaunchGrid } from "@/components/templates/templates-launch-grid";

type Props = {
  guest: boolean;
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
 * In-app embed — same launch grid as the public templates page.
 */
export function SelectableTemplatesThemeGrid({ guest, className }: Props) {
  return (
    <Suspense fallback={<GridFallback />}>
      <TemplatesLaunchGrid guest={guest} signedIn={!guest} className={className} />
    </Suspense>
  );
}
