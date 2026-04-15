-- =============================================================================
-- Storage buckets + object policies (private PDFs, public template assets)
-- Paths: resume-pdfs/{user_id}/{project_id}/... | template-assets/{template_id}/...
-- =============================================================================

-- Buckets (id must match bucket name for Supabase client)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'resume-pdfs',
    'resume-pdfs',
    false,
    52428800,
    ARRAY['application/pdf']::text[]
  ),
  (
    'template-assets',
    'template-assets',
    true,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
  ),
  (
    'avatars',
    'avatars',
    false,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- resume-pdfs: users read/write only inside folder named with their user id
-- -----------------------------------------------------------------------------
CREATE POLICY "resume_pdfs_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resume-pdfs'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "resume_pdfs_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resume-pdfs'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "resume_pdfs_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resume-pdfs'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'resume-pdfs'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "resume_pdfs_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resume-pdfs'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

-- -----------------------------------------------------------------------------
-- template-assets: public read; writes restricted to admins (service_role in dashboard)
-- -----------------------------------------------------------------------------
CREATE POLICY "template_assets_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'template-assets');

CREATE POLICY "template_assets_write_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'template-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "template_assets_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'template-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "template_assets_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'template-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- avatars: user-scoped paths only
-- -----------------------------------------------------------------------------
CREATE POLICY "avatars_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE ((SELECT auth.uid())::text || '/%')
  );
