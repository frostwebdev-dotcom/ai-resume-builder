"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeProjectMetadata, parseProjectMetadata } from "@/lib/projects/metadata";
import { slugifyTitle } from "@/lib/projects/slug";
import { isTemplateSlug, TEMPLATE_IDS } from "@/lib/resume-preview/template-ids";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { ROUTES } from "@/lib/constants";
import { createDemoWizardStateForTemplate } from "@/lib/resume-wizard/demo-wizard-state";
import type { Json } from "@/types/database";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  avatarExtensionFor,
  getAvatarService,
  isAvatarPathOwnedBy,
  removeAvatarObject,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  importGuestDraftPayloadSchema,
  projectIdSchema,
  renameProjectSchema,
  setProjectTemplateSchema,
} from "@/validation/projects";
import { updateResumeStyleSchema } from "@/validation/resume-style";
import { avatarActionSchema } from "@/validation/avatar";

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
    templateSlug: formData.get("templateSlug") ?? undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      error:
        flat.fieldErrors.title?.[0] ??
        flat.fieldErrors.templateSlug?.[0] ??
        "Invalid project details.",
    };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const slug = await ensureUniqueSlug(userId, parsed.data.title);

  const ts = parsed.data.templateSlug;
  const templateSlug: keyof typeof TEMPLATE_IDS =
    ts !== undefined && isTemplateSlug(ts) ? ts : "athena";
  const templateId = TEMPLATE_IDS[templateSlug];

  const demoWizardJson = JSON.parse(JSON.stringify(createDemoWizardStateForTemplate(templateSlug))) as Json;

  const { data: created, error } = await supabase
    .from("resume_projects")
    .insert({
      user_id: userId,
      title: parsed.data.title,
      slug,
      status: "draft",
      template_id: templateId,
      metadata: {
        wizard: demoWizardJson,
      },
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
  revalidatePath(ROUTES.app.resumes);
  revalidatePath(ROUTES.app.templates);
  // Land in the same studio editor as the public `/create` flow so the handoff feels continuous.
  redirect(ROUTES.app.projectBuild(created.id));
}

/**
 * `<form action>` entry (single `FormData`) for progressive enhancement and Next.js typing.
 * Delegates to {@link createProjectAction} (redirects on success).
 */
export async function createProjectFormAction(formData: FormData): Promise<void> {
  await createProjectAction({}, formData);
}

export type ImportGuestDraftResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string };

/**
 * Creates a resume project from the guest `/create` draft (wizard JSON + template + style)
 * so the user lands in Draft with server autosave. Client clears guest localStorage after success.
 */
export async function importGuestDraftToProjectAction(
  raw: unknown,
): Promise<ImportGuestDraftResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const parsed = importGuestDraftPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid draft data." };
  }

  const wizardParsed = wizardStateSchema.safeParse(parsed.data.wizard);
  if (!wizardParsed.success) {
    return {
      ok: false,
      error:
        "Some fields could not be imported. Check links (use https://) or shorten long text, then try again.",
    };
  }

  const templateSlug = parsed.data.templateSlug;
  if (!isTemplateSlug(templateSlug)) {
    return { ok: false, error: "Invalid template." };
  }
  const templateId = TEMPLATE_IDS[templateSlug];

  const title = parsed.data.title?.trim() || "Untitled resume";
  const slug = await ensureUniqueSlug(userId, title);

  const baseMeta = mergeProjectMetadata({}, { resume_style: parsed.data.resumeStyle });
  const metaObj =
    baseMeta && typeof baseMeta === "object" && !Array.isArray(baseMeta)
      ? (baseMeta as Record<string, unknown>)
      : {};
  const metadata = {
    ...metaObj,
    wizard: wizardParsed.data as unknown as Json,
  } as Json;

  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("resume_projects")
    .insert({
      user_id: userId,
      title,
      slug,
      status: "draft",
      template_id: templateId,
      metadata,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not save your resume to your account." };
  }

  trackServerEvent(ANALYTICS_EVENTS.PROJECT_CREATED, {
    project_id_prefix: created.id.slice(0, 8),
    source: "guest_create_import",
  });

  revalidatePath(ROUTES.app.root);
  revalidatePath(ROUTES.app.resumes);
  revalidatePath(ROUTES.app.templates);
  revalidatePath(ROUTES.app.project(created.id));
  revalidatePath(ROUTES.app.projectBuild(created.id));

  return { ok: true, projectId: created.id };
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

export async function updateResumeStyleAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateResumeStyleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid appearance settings." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();

  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Project not found." };
  }

  const { error } = await supabase
    .from("resume_projects")
    .update({
      metadata: mergeProjectMetadata(row.metadata, {
        resume_style: parsed.data.resumeStyle,
      }),
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.app.project(parsed.data.projectId));
  revalidatePath(ROUTES.app.projectBuild(parsed.data.projectId));
  revalidatePath(ROUTES.app.projectPreview(parsed.data.projectId));
  return { ok: true };
}

export type AvatarActionResult =
  | { ok: true; avatarPath: string }
  | { ok: false; code: "INPUT" | "AUTH" | "NOT_FOUND" | "UPLOAD"; error: string };

/**
 * Uploads a user avatar to the private `avatars` bucket and stores the object
 * key on the project metadata. Replaces any prior avatar for this project.
 *
 * Expects FormData: { projectId, file }. File is validated for size + mime.
 */
export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  const parsed = avatarActionSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) {
    return { ok: false, code: "INPUT", error: "Invalid project." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, code: "INPUT", error: "Select an image to upload." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      code: "INPUT",
      error: `Image too large. Max ${Math.round(AVATAR_MAX_BYTES / 1024 / 1024)} MB.`,
    };
  }
  if (!AVATAR_ALLOWED_MIME.has(file.type)) {
    return { ok: false, code: "INPUT", error: "Use a JPEG, PNG, or WebP image." };
  }

  const ext = avatarExtensionFor(file.type);
  if (!ext) {
    return { ok: false, code: "INPUT", error: "Unsupported image format." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, code: "AUTH", error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, code: "NOT_FOUND", error: "Project not found." };
  }

  const prior = parseProjectMetadata(row.metadata).avatar_path;

  // Upload via service role: bucket is private, and we also explicitly namespace
  // by userId so a compromised client can't smuggle someone else's path.
  const service = getAvatarService();
  const objectId = randomUUID();
  const storagePath = `${userId}/${parsed.data.projectId}/${objectId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    console.error("[avatars] upload", upErr);
    return { ok: false, code: "UPLOAD", error: "Could not upload avatar. Try again." };
  }

  // Persist new path then garbage-collect the prior one.
  const { error: updErr } = await supabase
    .from("resume_projects")
    .update({
      metadata: mergeProjectMetadata(row.metadata, { avatar_path: storagePath }),
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId);

  if (updErr) {
    // Roll back the upload to keep storage tidy.
    await removeAvatarObject(service, storagePath);
    return { ok: false, code: "UPLOAD", error: updErr.message };
  }

  if (prior && prior !== storagePath && isAvatarPathOwnedBy(prior, userId, parsed.data.projectId)) {
    await removeAvatarObject(service, prior);
  }

  revalidatePath(ROUTES.app.project(parsed.data.projectId));
  revalidatePath(ROUTES.app.projectPreview(parsed.data.projectId));
  return { ok: true, avatarPath: storagePath };
}

export async function removeAvatarAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = avatarActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid project." };

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, error: "Project not found." };

  const meta = parseProjectMetadata(row.metadata);
  const current = meta.avatar_path;

  const { error: updErr } = await supabase
    .from("resume_projects")
    .update({
      metadata: mergeProjectMetadata(row.metadata, { avatar_path: null }),
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId);

  if (updErr) return { ok: false, error: updErr.message };

  if (current && isAvatarPathOwnedBy(current, userId, parsed.data.projectId)) {
    await removeAvatarObject(getAvatarService(), current);
  }

  revalidatePath(ROUTES.app.project(parsed.data.projectId));
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
