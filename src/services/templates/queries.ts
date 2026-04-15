import "server-only";

import { TEMPLATE_IDS } from "@/lib/resume-preview/template-ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TemplateOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPremium: boolean;
};

/**
 * Active templates from Supabase. Falls back to static registry when the DB is not seeded yet.
 */
export async function listTemplatesForUi(): Promise<TemplateOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, slug, name, description, is_premium")
    .eq("is_active", true)
    .order("slug", { ascending: true });

  if (!error && data && data.length > 0) {
    return data.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      isPremium: t.is_premium,
    }));
  }

  return staticTemplateFallback();
}

function staticTemplateFallback(): TemplateOption[] {
  return [
    {
      id: TEMPLATE_IDS.athena,
      slug: "athena",
      name: "Athena",
      description:
        "Single column, strong hierarchy. Reliable for most roles and ATS parsers.",
      isPremium: false,
    },
    {
      id: TEMPLATE_IDS.meridian,
      slug: "meridian",
      name: "Meridian",
      description:
        "Structured header and section rhythm — clear without decorative noise.",
      isPremium: false,
    },
    {
      id: TEMPLATE_IDS.nova,
      slug: "nova",
      name: "Nova",
      description:
        "Compact spacing for dense careers. Best checked on a larger screen before export.",
      isPremium: false,
    },
  ];
}
