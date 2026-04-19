-- -----------------------------------------------------------------------------
-- Seed the remaining professional resume templates (Helios, Vanta, Lumen, Onyx,
-- Clio). UUIDs and slugs are aligned with `src/lib/resume-preview/template-ids.ts`
-- and the theme definitions in `src/lib/resume-preview/template-theme.ts`.
-- Idempotent: each INSERT is guarded by a NOT EXISTS check on slug.
-- -----------------------------------------------------------------------------
INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000004'::uuid,
  'helios',
  'Helios',
  'Warm amber serif with executive presence — centered classical layout.',
  true,
  false,
  '{"density":"comfortable","engine":"v1","font":"serif"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'helios');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000005'::uuid,
  'vanta',
  'Vanta',
  'Monochrome minimal layout — no decorative noise, ultra ATS-safe.',
  true,
  false,
  '{"density":"comfortable","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'vanta');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000006'::uuid,
  'lumen',
  'Lumen',
  'Airy modern split header with emerald accents. Designed for product and growth roles.',
  true,
  false,
  '{"density":"comfortable","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'lumen');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000007'::uuid,
  'onyx',
  'Onyx',
  'Bold navy banner header with an authoritative leadership tone.',
  true,
  false,
  '{"density":"comfortable","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'onyx');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000008'::uuid,
  'clio',
  'Clio',
  'Traditional serif with burgundy restraint — suited to academic and formal sectors.',
  true,
  false,
  '{"density":"comfortable","engine":"v1","font":"serif"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'clio');
