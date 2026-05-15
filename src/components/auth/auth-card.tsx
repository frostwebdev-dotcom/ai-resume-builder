import type { ReactNode } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { APP_NAME, ROUTES } from "@/lib/constants";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <PageContainer className="flex min-h-dvh min-w-0 flex-1 flex-col justify-center py-10 pb-safe sm:min-h-0 sm:py-16">
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,24rem)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href={ROUTES.home}
            aria-label={`${APP_NAME} — home`}
            className="group mb-6 inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            <span className="brand-mark" aria-hidden>
              S
            </span>
            <span className="text-sm font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-headline text-balance">{title}</h1>
          {description ? (
            <p className="mt-2 text-body-muted text-pretty">{description}</p>
          ) : null}
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          {children}
        </div>
        <ul className="trust-row mt-6">
          <li>
            <ShieldCheck className="size-3.5 text-success" aria-hidden />
            <span>Encrypted in transit</span>
          </li>
          <li>
            <Lock className="size-3.5 text-brand" aria-hidden />
            <span>Your data stays private</span>
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}
