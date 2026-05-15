-- Client + server product analytics (allowlisted events only; no resume body / PII).
-- Ingested via /api/analytics/event and optional server-side persist helpers.

CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_ts bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_analytics_events_event_created_idx
  ON public.product_analytics_events (event, created_at DESC);

COMMENT ON TABLE public.product_analytics_events IS 'Privacy-safe product analytics beacons; props must stay non-PII.';

ALTER TABLE public.product_analytics_events ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated cannot read/write; service_role bypasses RLS for API ingest + admin reads.

-- Accurate paid revenue sums (PostgREST row caps do not apply).
CREATE OR REPLACE FUNCTION public.admin_sum_paid_cents_between(p_from timestamptz, p_to timestamptz)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(p.amount_cents), 0)::bigint
  FROM public.payments p
  WHERE p.status = 'paid'
    AND COALESCE(p.paid_at, p.created_at) >= p_from
    AND COALESCE(p.paid_at, p.created_at) <= p_to;
$$;

REVOKE ALL ON FUNCTION public.admin_sum_paid_cents_between(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sum_paid_cents_between(timestamptz, timestamptz) TO service_role;
