"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeProjectMetadata } from "@/lib/projects/metadata";
import { slugifyTitle } from "@/lib/projects/slug";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS } from "@/lib/resume-preview/template-ids";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  projectIdSchema,
  renameProjectSchema,
  setProjectTemplateSchema,
} from "@/validation/projects";

export type ProjectActionState = {
  error?: string;
  success?: string;
};

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function ensureUniqueSlug(userId: string, base: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const root = slugifyTitle(base);
  for (let n = 0; n < 24; n++) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const { data } = await supabase
      .from("resume_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", candidate)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid name." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const slug = await ensureUniqueSlug(userId, parsed.data.title);

  const { data: created, error } = await supabase
    .from("resume_projects")
    .insert({
      user_id: userId,
      title: parsed.data.title,
      slug,
      status: "draft",
      template_id: DEFAULT_TEMPLATE_ID,
      metadata: {},
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Could not create project." };
  }

  trackServerEvent(ANALYTICS_EVENTS.PROJECT_CREATED, {
    project_id_prefix: created.id.slice(0, 8),
  });

  revalidatePath(ROUTES.app.root);
  redirect(ROUTES.app.project(created.id));
}

export async function renameProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = renameProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    const err = parsed.error.flatten();
    return {
      error:
        err.fieldErrors.title?.[0] ??
        err.fieldErrors.projectId?.[0] ??
        "Invalid input.",
    };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("resume_projects")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.app.root);
  revalidatePath(ROUTES.app.project(parsed.data.projectId));
  return { success: "Renamed." };
}

export async function deleteProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = projectIdSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) {
    return { error: "Invalid project." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("resume_projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.app.root);
  redirect(ROUTES.app.root);
}

export async function duplicateProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = projectIdSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) {
    return { error: "Invalid project." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const sourceId = parsed.data.projectId;

  const { data: source, error: srcErr } = await supabase
    .from("resume_projects")
    .select("id, title, metadata, template_id, status")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (srcErr || !source) {
    return { error: "Project not found." };
  }

  const newTitle = `${source.title} (copy)`;
  const slug = await ensureUniqueSlug(userId, newTitle);

  const { data: copy, error: insErr } = await supabase
    .from("resume_projects")
    .insert({
      user_id: userId,
      title: newTitle,
      slug,
      status: "draft",
      template_id: source.template_id,
      metadata: mergeProjectMetadata(source.metadata, { ready_for_preview: false }),
    })
    .select("id")
    .single();

  if (insErr || !copy) {
    return { error: insErr?.message ?? "Could not duplicate project." };
  }

  const { data: sections, error: secErr } = await supabase
    .from("resume_sections")
    .select("section_type, sort_order, content")
    .eq("project_id", sourceId)
    .order("sort_order", { ascending: true });

  if (secErr) {
    return { error: secErr.message };
  }

  if (sections && sections.length > 0) {
    const { error: bulkErr } = await supabase.from("resume_sections").insert(
      sections.map((s) => ({
        project_id: copy.id,
        section_type: s.section_type,
        sort_order: s.sort_order,
        content: s.content,
      })),
    );
    if (bulkErr) {
      return { error: bulkErr.message };
    }
  }

  revalidatePath(ROUTES.app.root);
  redirect(ROUTES.app.project(copy.id));
}

export async function setProjectTemplateAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = setProjectTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid template selection." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();

  const { data: tpl } = await supabase
    .from("templates")
    .select("id")
    .eq("id", parsed.data.templateId)
    .eq("is_active", true)
    .maybeSingle();

  const staticIds = new Set<string>(Object.values(TEMPLATE_IDS));
  if (!tpl && !staticIds.has(parsed.data.templateId)) {
    return { ok: false, error: "That template is not available." };
  }

  const { error } = await supabase
    .from("resume_projects")
    .update({ template_id: parsed.data.templateId })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.app.project(parsed.data.projectId));
  revalidatePath(ROUTES.app.projectBuild(parsed.data.projectId));
  revalidatePath(ROUTES.app.projectPreview(parsed.data.projectId));
  return { ok: true };
}

export async function markReadyForPreviewAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = projectIdSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) {
    return { error: "Invalid project." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();

  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) return { error: "Project not found." };

  const { error } = await supabase
    .from("resume_projects")
    .update({
      metadata: mergeProjectMetadata(row.metadata, { ready_for_preview: true }),
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.app.root);
  revalidatePath(ROUTES.app.project(parsed.data.projectId));
  return { success: "Marked ready for preview." };
}
