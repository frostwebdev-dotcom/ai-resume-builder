import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <PageContainer className="flex min-h-dvh flex-1 flex-col justify-center py-10 pb-safe sm:min-h-0 sm:py-16">
      <div className="mx-auto w-full max-w-[min(100%,24rem)]">
        <div className="mb-8 text-center">
          <h1 className="text-headline text-balance">{title}</h1>
          {description ? (
            <p className="mt-2 text-body-muted text-pretty">{description}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </PageContainer>
  );
}
