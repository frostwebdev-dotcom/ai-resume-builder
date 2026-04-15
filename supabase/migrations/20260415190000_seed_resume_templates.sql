-- -----------------------------------------------------------------------------
-- Seed resume layout templates (fixed UUIDs aligned with app registry)
-- -----------------------------------------------------------------------------
INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000001'::uuid,
  'athena',
  'Athena',
  'Single column, strong hierarchy. Reliable for most roles and ATS parsers.',
  true,
  false,
  '{"density":"comfortable","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'athena');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000002'::uuid,
  'meridian',
  'Meridian',
  'Clear header grid and section rhythm — structured without decorative noise.',
  true,
  false,
  '{"density":"comfortable","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'meridian');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT
  'a0000001-0000-4000-8000-000000000003'::uuid,
  'nova',
  'Nova',
  'Tighter spacing for dense careers. Best reviewed on a larger screen before export.',
  true,
  false,
  '{"density":"compact","engine":"v1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'nova');
