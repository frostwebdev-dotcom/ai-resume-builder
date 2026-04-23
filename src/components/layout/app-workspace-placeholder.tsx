import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Optional content above the card (e.g. guest sign-in banner). */
  header?: ReactNode;
};

/**
 * Placeholder shell for dashboard sidebar routes that are not implemented yet.
 */
export function AppWorkspacePlaceholder({ title, description, icon: Icon, header }: Props) {
  return (
    <section className="min-h-0 flex-1 bg-slate-100 py-6 sm:py-8">
      <PageContainer>
        {header}
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <Icon className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
      </PageContainer>
    </section>
  );
}
