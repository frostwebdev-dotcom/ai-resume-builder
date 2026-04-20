import { GuestCreateDynamic } from "@/components/resume-wizard/guest-create-dynamic";

export const metadata = {
  title: "Create resume",
  description:
    "Build your resume in a studio workspace. Sign in when you're ready to save in your account.",
};

export default function CreateResumePage() {
  return (
    <section className="flex min-h-screen flex-1 flex-col bg-slate-50 p-2 sm:p-3">
      <GuestCreateDynamic />
    </section>
  );
}
