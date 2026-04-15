-- =============================================================================
-- AI Resume Builder — initial schema
-- Run via Supabase CLI: supabase db push / supabase migration up
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: maintain updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user; billing + role for admin RLS
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  stripe_customer_id text UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_stripe_customer_id_idx ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- templates — global resume layouts; premium flags for upsells (no user FK)
-- -----------------------------------------------------------------------------
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  preview_image_path text,
  is_active boolean NOT NULL DEFAULT true,
  is_premium boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX templates_active_idx ON public.templates (is_active) WHERE is_active = true;

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- resume_projects — multiple resumes per user; soft delete for recovery
-- -----------------------------------------------------------------------------
CREATE TABLE public.resume_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived', 'published')),
  template_id uuid REFERENCES public.templates (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX resume_projects_user_idx ON public.resume_projects (user_id, created_at DESC);
CREATE INDEX resume_projects_user_active_idx ON public.resume_projects (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER resume_projects_set_updated_at
  BEFORE UPDATE ON public.resume_projects
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- resume_sections — structured blocks; content JSON for flexible AI + UI
-- -----------------------------------------------------------------------------
CREATE TABLE public.resume_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.resume_projects (id) ON DELETE CASCADE,
  section_type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resume_sections_sort_non_negative CHECK (sort_order >= 0)
);

CREATE INDEX resume_sections_project_sort_idx ON public.resume_sections (project_id, sort_order);

CREATE TRIGGER resume_sections_set_updated_at
  BEFORE UPDATE ON public.resume_sections
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- resume_versions — immutable history; project-wide OR per-section snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE public.resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.resume_projects (id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.resume_sections (id) ON DELETE SET NULL,
  version_number integer NOT NULL,
  parent_version_id uuid REFERENCES public.resume_versions (id) ON DELETE SET NULL,
  content_snapshot jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('user', 'ai', 'import', 'merge')),
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX resume_versions_unique_section_version
  ON public.resume_versions (section_id, version_number)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX resume_versions_unique_project_version
  ON public.resume_versions (project_id, version_number)
  WHERE section_id IS NULL;

CREATE INDEX resume_versions_project_idx ON public.resume_versions (project_id, created_at DESC);
CREATE INDEX resume_versions_section_idx ON public.resume_versions (section_id, created_at DESC)
  WHERE section_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- job_targets — tailoring / future job-specific upsells per project
-- -----------------------------------------------------------------------------
CREATE TABLE public.job_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.resume_projects (id) ON DELETE CASCADE,
  title text,
  company text,
  job_description text,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_targets_project_idx ON public.job_targets (project_id);

CREATE TRIGGER job_targets_set_updated_at
  BEFORE UPDATE ON public.job_targets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- orders — commerce intent; product_sku extensible for upsells
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.resume_projects (id) ON DELETE SET NULL,
  stripe_checkout_session_id text UNIQUE,
  product_sku text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX orders_project_idx ON public.orders (project_id)
  WHERE project_id IS NOT NULL;
CREATE INDEX orders_status_idx ON public.orders (status);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments — Stripe charges linked to orders (one order : many payments OK)
-- -----------------------------------------------------------------------------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_idx ON public.payments (order_id);

-- -----------------------------------------------------------------------------
-- downloads — generated PDFs metadata + entitlement linkage
-- -----------------------------------------------------------------------------
CREATE TABLE public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.resume_projects (id) ON DELETE CASCADE,
  resume_version_id uuid REFERENCES public.resume_versions (id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX downloads_user_idx ON public.downloads (user_id, created_at DESC);
CREATE INDEX downloads_project_idx ON public.downloads (project_id);
CREATE INDEX downloads_order_idx ON public.downloads (order_id)
  WHERE order_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- ai_generation_logs — observability; prompt_hash only, never raw prompts
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.resume_projects (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.resume_sections (id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'openai',
  model text,
  prompt_hash text,
  tokens_prompt integer,
  tokens_completion integer,
  latency_ms integer,
  ok boolean NOT NULL DEFAULT true,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_logs_user_created_idx ON public.ai_generation_logs (user_id, created_at DESC);
CREATE INDEX ai_logs_project_idx ON public.ai_generation_logs (project_id)
  WHERE project_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- admin_audit_logs — admin actions; no user self-service writes from client
-- -----------------------------------------------------------------------------
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_actor_idx ON public.admin_audit_logs (actor_id, created_at DESC);
CREATE INDEX admin_audit_resource_idx ON public.admin_audit_logs (resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- Auth: auto-create profile on signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- profiles: own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- templates: read active (authenticated); writes via service role only (no policy = deny for non-owner operations — service_role bypasses RLS)
CREATE POLICY "templates_select_authenticated"
  ON public.templates FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

-- resume_projects
CREATE POLICY "resume_projects_all_own"
  ON public.resume_projects FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- resume_sections: own via project
CREATE POLICY "resume_sections_all_via_project"
  ON public.resume_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = resume_sections.project_id AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = resume_sections.project_id AND p.user_id = (SELECT auth.uid())
    )
  );

-- resume_versions: own via project
CREATE POLICY "resume_versions_all_via_project"
  ON public.resume_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = resume_versions.project_id AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = resume_versions.project_id AND p.user_id = (SELECT auth.uid())
    )
  );

-- job_targets
CREATE POLICY "job_targets_all_via_project"
  ON public.job_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = job_targets.project_id AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resume_projects p
      WHERE p.id = job_targets.project_id AND p.user_id = (SELECT auth.uid())
    )
  );

-- orders: read own (insert/update from Stripe webhooks use service_role)
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- payments: read if order belongs to user
CREATE POLICY "payments_select_via_order"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.user_id = (SELECT auth.uid())
    )
  );

-- downloads: read-only for users; inserts/updates from server (service_role) after PDF generation
CREATE POLICY "downloads_select_own"
  ON public.downloads FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ai_generation_logs: own rows
CREATE POLICY "ai_generation_logs_select_own"
  ON public.ai_generation_logs FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "ai_generation_logs_insert_own"
  ON public.ai_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- admin_audit_logs: admins read only; inserts via service_role / edge functions
CREATE POLICY "admin_audit_logs_select_admin"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );
