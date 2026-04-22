import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

/**
 * Legacy spike URL — forwards to the real studio draft so bookmarks still work.
 */
export default async function StudioSpikePage({ params }: PageProps) {
  const { projectId } = await params;
  await requireUser({ nextPath: ROUTES.app.projectBuild(projectId) });
  redirect(ROUTES.app.projectBuild(projectId));
}
