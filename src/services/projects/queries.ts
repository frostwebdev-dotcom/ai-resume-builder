import "server-only";

import {
  displayStatusLabel,
  resolveProjectDisplayStatus,
  type ProjectDisplayStatus,
} from "@/lib/projects/display-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeProject } from "@/types/database";

export type DashboardProject = {
  id: string;
  title: string;
  slug: string;
  dbStatus: ResumeProject["status"];
  updatedAt: string;
  createdAt: string;
  isArchived: boolean;
  displayStatus: ProjectDisplayStatus;
  displayLabel: string;
};

export type ProjectDetail = {
  project: Pick<
    ResumeProject,
    "id" | "title" | "slug" | "status" | "metadata" | "template_id" | "created_at" | "updated_at"
  >;
  displayStatus: ProjectDisplayStatus;
  displayLabel: string;
  isArchived: boolean;
};

function labelFor(
  isArchived: boolean,
  displayStatus: ProjectDisplayStatus,
): string {
  if (isArchived) return "Archived";
  return displayStatusLabel[displayStatus];
}

/**
 * Dashboard list with derived workflow status (orders + downloads + metadata).
 */
export async function getDashboardProjects(
  userId: string,
): Promise<DashboardProject[]> {
  const supabase = await createSupabaseServerClient();

  const { data: projects, error: pErr } = await supabase
    .from("resume_projects")
    .select("id, title, slug, status, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (pErr || !projects) {
    throw new Error(pErr?.message ?? "Could not load projects.");
  }

  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);

  const { data: orders } = await supabase
    .from("orders")
    .select("project_id")
    .eq("status", "completed")
    .in("project_id", ids);

  const { data: downloads } = await supabase
    .from("downloads")
    .select("project_id")
    .in("project_id", ids);

  const paidIds = new Set(
    (orders ?? []).map((o) => o.project_id).filter(Boolean) as string[],
  );
  const downloadedIds = new Set(
    (downloads ?? []).map((d) => d.project_id).filter(Boolean) as string[],
  );

  return projects.map((row) => {
    const isArchived = row.status === "archived";
    const hasDownload = downloadedIds.has(row.id);
    const hasCompletedOrder = paidIds.has(row.id);
    const displayStatus = resolveProjectDisplayStatus(row, {
      hasCompletedOrder,
      hasDownload,
    });
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      dbStatus: row.status,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      isArchived,
      displayStatus,
      displayLabel: labelFor(isArchived, displayStatus),
    };
  });
}

/**
 * Single project for detail shell; null if missing or not owned.
 */
export async function getProjectDetailForUser(
  userId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from("resume_projects")
    .select(
      "id, title, slug, status, metadata, template_id, created_at, updated_at",
    )
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !row) return null;

  const { data: orderHit } = await supabase
    .from("orders")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  const { data: dlHit } = await supabase
    .from("downloads")
    .select("id")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();

  const isArchived = row.status === "archived";
  const displayStatus = resolveProjectDisplayStatus(row, {
    hasCompletedOrder: Boolean(orderHit),
    hasDownload: Boolean(dlHit),
  });

  return {
    project: row,
    displayStatus,
    isArchived,
    displayLabel: labelFor(isArchived, displayStatus),
  };
}
