-- Structured AI outputs (scores, etc.) — no raw prompts; optional analytics.
CREATE TABLE public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.resume_projects (id) ON DELETE SET NULL,
  kind text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_suggestions_user_created_idx ON public.ai_suggestions (user_id, created_at DESC);
CREATE INDEX ai_suggestions_project_idx ON public.ai_suggestions (project_id)
  WHERE project_id IS NOT NULL;

-- Optional DB-side quota bookkeeping (Upstash Redis remains the primary limiter in app code).
CREATE TABLE public.ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  bucket text NOT NULL,
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bucket)
);

CREATE INDEX ai_usage_limits_user_bucket_idx ON public.ai_usage_limits (user_id, bucket);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_suggestions_select_own"
  ON public.ai_suggestions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "ai_suggestions_insert_own"
  ON public.ai_suggestions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "ai_usage_limits_select_own"
  ON public.ai_usage_limits FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "ai_usage_limits_insert_own"
  ON public.ai_usage_limits FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "ai_usage_limits_update_own"
  ON public.ai_usage_limits FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
