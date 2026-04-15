import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

export default function ResumeRedirectPage() {
  redirect(ROUTES.app.root);
}
