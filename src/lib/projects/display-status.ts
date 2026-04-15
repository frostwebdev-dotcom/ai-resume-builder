import type { ResumeProject } from "@/types/database";

import { parseProjectMetadata } from "@/lib/projects/metadata";

/**
 * User-facing workflow status for dashboards (derived from orders, downloads, and metadata).
 */
export type ProjectDisplayStatus =
  | "draft"
  | "ready_for_preview"
  | "paid"
  | "downloaded";

export type ProjectStatusContext = {
  hasCompletedOrder: boolean;
  hasDownload: boolean;
};

export function resolveProjectDisplayStatus(
  project: Pick<ResumeProject, "metadata">,
  ctx: ProjectStatusContext,
): ProjectDisplayStatus {
  if (ctx.hasDownload) return "downloaded";
  if (ctx.hasCompletedOrder) return "paid";
  const meta = parseProjectMetadata(project.metadata);
  if (meta.ready_for_preview) return "ready_for_preview";
  return "draft";
}

export const displayStatusLabel: Record<ProjectDisplayStatus, string> = {
  draft: "Draft",
  ready_for_preview: "Ready for preview",
  paid: "Paid",
  downloaded: "Downloaded",
};
