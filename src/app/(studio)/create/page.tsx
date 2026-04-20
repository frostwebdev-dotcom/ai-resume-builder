import { GuestCreateDynamic } from "@/components/resume-wizard/guest-create-dynamic";

export const metadata = {
  title: "Create resume",
  description:
    "Build your resume in a studio workspace. Sign in when you're ready to save in your account.",
};

export default function CreateResumePage() {
  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 p-0">
      <GuestCreateDynamic />
    </section>
  );
}
