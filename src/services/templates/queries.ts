import "server-only";

import {
  TEMPLATE_IDS,
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
  isTemplateSlug,
  templatePublicDisplayName,
} from "@/lib/resume-preview/template-ids";
import { ALL_TEMPLATE_THEMES, sortTemplateSlugsPhotoCapableFirst } from "@/lib/resume-preview/template-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TemplateOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPremium: boolean;
};

/** Legacy seed slugs (first three UUIDs) before app registry names. */
const LEGACY_DB_SLUG_TO_APP: Record<string, TemplateSlug> = {
  athena: "professional-ats",
  meridian: "modern-professional",
  nova: "technical-clean",
};

function normalizeTemplateSlugFromDb(raw: string): string {
  return LEGACY_DB_SLUG_TO_APP[raw] ?? raw;
}

/**
 * Active templates from Supabase. Falls back to the static theme registry
 * when the DB is not seeded yet (e.g. local dev or a fresh CI run).
 */
export async function listTemplatesForUi(): Promise<TemplateOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, slug, name, description, is_premium")
    .eq("is_active", true)
    .order("slug", { ascending: true });

  if (!error && data && data.length > 0) {
    const merged = data.map((t) => {
      const slug = normalizeTemplateSlugFromDb(t.slug);
      const canonical = isTemplateSlug(slug) ? slug : null;
      return {
        id: t.id,
        slug,
        name: canonical ? templatePublicDisplayName(canonical) : t.name,
        description: t.description,
        isPremium: t.is_premium,
      };
    });
    const known = new Set(merged.map((r) => r.slug));
    for (const extra of staticTemplateFallback()) {
      if (!known.has(extra.slug)) merged.push(extra);
    }
    return sortTemplateRowsPhotoFirst(merged.filter((row) => isTemplateSlug(row.slug)));
  }

  return staticTemplateFallback();
}

function sortTemplateRowsPhotoFirst(rows: TemplateOption[]): TemplateOption[] {
  const order = new Map(
    sortTemplateSlugsPhotoCapableFirst([...TEMPLATE_SLUG_ORDER]).map((slug, idx) => [slug, idx]),
  );
  return [...rows].sort((a, b) => {
    if (!isTemplateSlug(a.slug) || !isTemplateSlug(b.slug)) return 0;
    return (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999);
  });
}

function staticTemplateFallback(): TemplateOption[] {
  return ALL_TEMPLATE_THEMES.map((theme) => ({
    id: TEMPLATE_IDS[theme.slug as TemplateSlug],
    slug: theme.slug,
    name: theme.name,
    description: `${theme.pickerTagline} ${theme.bestFor}`,
    isPremium: false,
  }));
}
