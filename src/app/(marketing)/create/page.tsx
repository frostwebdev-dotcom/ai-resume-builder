import { GuestCreateDynamic } from "@/components/resume-wizard/guest-create-dynamic";
import { PageContainer } from "@/components/layout/page-container";

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
        <GuestCreateDynamic />
      </PageContainer>
    </section>
  );
}
