import { Suspense } from "react";

import { GuestCreateDynamic } from "@/components/resume-wizard/guest-create-dynamic";

export const metadata = {
  title: "Resume draft",
  description:
    "Draft your resume on this device with a live preview. Sign in when you are ready to save a project in your account, then preview and export a PDF.",
};

function CreateResumeFallback() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16"
      aria-busy
      aria-label="Loading resume builder"
    >
      <div className="size-8 animate-pulse rounded-full bg-brand/20 ring-2 ring-brand/30" />
      <p className="text-sm text-muted-foreground">Loading draft…</p>
    </div>
  );
}

export default function CreateResumePage() {
  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 p-0">
      <h1 className="sr-only">
        Resume draft — edit on this device, preview as you go; sign in to save a project and export
      </h1>
      {/*
        Server `Suspense` boundary for the client tree that uses `useSearchParams` (guest builder).
        Avoids static-generation / CSR bailout issues on Vercel that can surface as a blank or error page.
      */}
      <Suspense fallback={<CreateResumeFallback />}>
        <GuestCreateDynamic />
      </Suspense>
    </section>
  );
}
