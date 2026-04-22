"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

/**
 * `next/dynamic` with `{ ssr: false }` must be declared from a Client Component file (Next 16+).
 * Keeps the guest builder off the server so `localStorage` is read on first client paint.
 */
const GuestCreateClient = dynamic(
  () =>
    import("@/components/resume-wizard/guest-create-client").then((m) => ({
      default: m.GuestCreateClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16"
        aria-busy
        aria-label="Loading resume builder"
      >
        <div className="size-8 animate-pulse rounded-full bg-brand/20 ring-2 ring-brand/30" />
        <p className="text-sm text-muted-foreground">Loading draft…</p>
      </div>
    ),
  },
);

export function GuestCreateDynamic() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16"
          aria-busy
          aria-label="Loading resume builder"
        >
          <div className="size-8 animate-pulse rounded-full bg-brand/20 ring-2 ring-brand/30" />
          <p className="text-sm text-muted-foreground">Loading draft…</p>
        </div>
      }
    >
      <GuestCreateClient />
    </Suspense>
  );
}
