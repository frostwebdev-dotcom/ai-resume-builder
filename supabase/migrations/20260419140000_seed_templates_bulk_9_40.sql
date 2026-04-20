-- Seed resume templates 9–40 (UUIDs aligned with `src/lib/resume-preview/template-ids.ts`).

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000009'::uuid, 'astra', 'Astra', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'astra');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000a'::uuid, 'borealis', 'Borealis', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'borealis');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000b'::uuid, 'cypress', 'Cypress', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'cypress');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000c'::uuid, 'denali', 'Denali', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'denali');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000d'::uuid, 'ember', 'Ember', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'ember');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000e'::uuid, 'fjord', 'Fjord', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'fjord');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000000f'::uuid, 'granite', 'Granite', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'granite');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000010'::uuid, 'harbor', 'Harbor', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'harbor');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000011'::uuid, 'iris', 'Iris', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'iris');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000012'::uuid, 'jade', 'Jade', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'jade');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000013'::uuid, 'kelvin', 'Kelvin', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'kelvin');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000014'::uuid, 'luna', 'Luna', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'luna');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000015'::uuid, 'matrix', 'Matrix', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'matrix');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000016'::uuid, 'nimbus', 'Nimbus', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'nimbus');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000017'::uuid, 'orion', 'Orion', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'orion');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000018'::uuid, 'pacific', 'Pacific', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'pacific');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000019'::uuid, 'quartz', 'Quartz', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'quartz');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001a'::uuid, 'ridge', 'Ridge', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'ridge');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001b'::uuid, 'slate', 'Slate', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'slate');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001c'::uuid, 'titan', 'Titan', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'titan');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001d'::uuid, 'umber', 'Umber', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'umber');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001e'::uuid, 'vertex', 'Vertex', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'vertex');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-00000000001f'::uuid, 'willow', 'Willow', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'willow');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000020'::uuid, 'xenon', 'Xenon', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'xenon');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000021'::uuid, 'yield', 'Yield', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'yield');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000022'::uuid, 'zephyr', 'Zephyr', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'zephyr');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000023'::uuid, 'apex', 'Apex', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'apex');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000024'::uuid, 'bridge', 'Bridge', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'bridge');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000025'::uuid, 'cipher', 'Cipher', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'cipher');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000026'::uuid, 'drift', 'Drift', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'drift');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000027'::uuid, 'echo', 'Echo', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'echo');

INSERT INTO public.templates (id, slug, name, description, is_active, is_premium, metadata)
SELECT 'a0000001-0000-4000-8000-000000000028'::uuid, 'forge', 'Forge', 'Professional ATS-friendly layout — preview matches PDF export.', true, false, '{"engine":"v1","density":"varied"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE slug = 'forge');
