import dynamic from "next/dynamic";

import { PageContainer } from "@/components/layout/page-container";

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
        <p className="text-sm text-muted-foreground">Loading builder…</p>
      </div>
    ),
  },
);

export const metadata = {
  title: "Create resume",
  description: "Build your resume in the browser. Sign in when you're ready to save to your account.",
};

/**
 * Public resume builder — no account required. Draft is stored in `localStorage`
 * (see `useGuestWizardAutosave`). Sign in from this page to move work to a saved project later.
 */
export default function CreateResumePage() {
  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-[1400px] xl:px-6 2xl:px-8">
        <GuestCreateClient />
      </PageContainer>
    </section>
  );
}
