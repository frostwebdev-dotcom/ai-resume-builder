import { GuestCreateDynamic } from "@/components/resume-wizard/guest-create-dynamic";

export const metadata = {
  title: "Resume draft",
  description:
    "Draft your resume on this device with a live preview. Sign in when you are ready to save a project in your account, then preview and export a PDF.",
};

export default function CreateResumePage() {
  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 p-0">
      <h1 className="sr-only">
        Resume draft — edit on this device, preview as you go; sign in to save a project and export
      </h1>
      <GuestCreateDynamic />
    </section>
  );
}
