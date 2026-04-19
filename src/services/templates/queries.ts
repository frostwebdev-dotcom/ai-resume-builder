import "server-only";

import { TEMPLATE_IDS, type TemplateSlug } from "@/lib/resume-preview/template-ids";
import { ALL_TEMPLATE_THEMES } from "@/lib/resume-preview/template-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TemplateOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPremium: boolean;
};

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
    const known = new Set<string>(data.map((r) => r.slug));
    const merged = data.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      isPremium: t.is_premium,
    }));
    for (const extra of staticTemplateFallback()) {
      if (!known.has(extra.slug)) merged.push(extra);
    }
    return merged;
  }

  return staticTemplateFallback();
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
