# Launch readiness — AI Resume Builder MVP

This document supports **QA**, **go-live decisions**, and **post-launch operations**. Keep it updated as the product and infrastructure change.

---

## QA checklist (pre-release)

**First-time user / guest + signed-in flows (release gate):** [docs/qa/resume-flows.md](qa/resume-flows.md)

### Authentication & sessions

- [ ] Sign up, email confirmation (if enabled), sign in, sign out.
- [ ] Password reset: request link, follow link, set new password, sign in.
- [ ] OAuth (if enabled): callback lands on intended `next` path after `sanitizeNextPath`.
- [ ] Session refresh: stay logged in across navigation; cookies refresh via `src/proxy.ts` + Supabase.
- [ ] Expired session: open builder with stale session → save shows friendly message (see autosave) or redirect to login for protected routes.
- [ ] Logged-in user hitting `/login` or `/signup` redirects to `/app`.

### Resume builder & autosave

- [ ] Edit fields; autosave debounce fires (~900ms); status shows Saving → Saved.
- [ ] Invalid wizard payload (e.g. bad URL in schema) → validation error, no silent data loss.
- [ ] Retry after save error works (`Try again` / `Save failed — retry`).
- [ ] Closing tab with unsaved edits triggers browser warning (`useUnsavedWarning` — behavior varies on mobile).
- [ ] Navigating away with unsaved changes (in-app) shows warning where implemented.

### AI features

- [ ] Happy path: generation returns structured JSON and updates UI.
- [ ] Quota exceeded → clear message (`QUOTA`).
- [ ] OpenAI missing / misconfigured → `NO_AI` or configuration message (no stack trace to user).
- [ ] Empty response / JSON parse / schema mismatch → user-safe copy + row in `ai_generation_logs` when DB insert succeeds.

### Billing & Stripe

- [ ] Start checkout from preview → Stripe Checkout opens with correct amount/metadata.
- [ ] **Success**: return URL with `session_id` → polling or webhook completes order → preview shows paid / download unlocked.
- [ ] **Cancel / back**: user returns without paying → order not completed; UI does not show paid.
- [ ] **Failed payment**: order marked failed where applicable; user can retry checkout.
- [ ] Webhook: `checkout.session.completed` with valid signature updates order + payment (idempotent if replayed — completed order skipped).
- [ ] Webhook: invalid signature → **400** (no retry storm).
- [ ] Webhook: DB error during processing → **500** so Stripe retries.

### Downloads & entitlement

- [ ] No completed order → download action returns `PAYMENT_REQUIRED` with clear message.
- [ ] Completed order → PDF generates, storage upload, signed URL returned; rate limit not exceeded.
- [ ] Wrong `projectId` / other user’s project → `NOT_FOUND` / no leak.

### Admin

- [ ] Non-admin user opening `/admin/*` → redirected to `/app` (proxy) and **server** `requireAdmin()` in layout.
- [ ] Admin can load admin pages; sensitive actions audited where implemented (`admin_audit_logs` on order completion).

### Mobile & layout

- [ ] Bottom nav, safe areas, sticky wizard bar, preview horizontal scroll (`touch-pan-x`).
- [ ] Forms usable with on-screen keyboard (inputs `text-base` on small screens).

### API & health

- [ ] `GET /api/health` returns OK in deployment.
- [ ] `POST /api/webhooks/stripe` only accepts raw body (no JSON parse before verify).

### Content & navigation

- [ ] Marketing nav, footer links, `/app` sidebar / bottom nav — no 404s.
- [ ] `robots.txt` / `sitemap.xml` acceptable for launch (indexing policy).

---

## Launch readiness checklist

### Configuration

- [ ] **Vercel**: Production env vars set (see [Deployment](#deployment-notes-vercel)).
- [ ] **Supabase**: Production project; RLS enabled; auth redirect URLs include `https://<domain>/auth/callback`.
- [ ] **Stripe**: Live mode keys in production; webhook endpoint URL and signing secret match; test event delivery.
- [ ] **OpenAI**: Production key; model name set if overriding default.
- [ ] **Resend** (if emails on): Domain verified; `EMAIL_FROM` set.
- [ ] **Sentry**: `NEXT_PUBLIC_SENTRY_DSN` set; release/source maps optional via CI.
- [ ] **Redis** (rate limits): Upstash URLs/tokens for production.

### Security

- [ ] No secrets in `NEXT_PUBLIC_*` or client bundles.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only on server / CI secrets.
- [ ] Stripe webhook secret not shared; endpoint HTTPS only.

### Observability

- [ ] Error tracking (Sentry) receiving test events.
- [ ] Vercel log drain or alert policy for 5xx on webhook and critical routes.

### Legal / product

- [ ] Privacy & terms links accurate for data you collect (AI, Stripe, email).
- [ ] Support / contact path works (`/contact` or mailto).

---

## Recommended test cases (manual)

| Area | Scenario | Expected |
|------|-----------|----------|
| Auth | Login with wrong password | Error message, no account enumeration if policy requires |
| Auth | Use reset link twice | Second use fails gracefully (`?error=auth` on login) |
| Session | Clear cookies mid-build, then edit | Save fails with session/expiry messaging or redirect |
| Autosave | Rapid typing for 30s | Debounced saves; no duplicate corrupt state |
| AI | Simulate 429 (or rate limit in dashboard) | Friendly busy message; optional retry |
| Checkout | Complete payment in Stripe test mode | Order `completed`, download works |
| Checkout | Close Checkout before pay | No entitlement; return page explains state |
| Webhook | Replay same `checkout.session.completed` | Idempotent; no double payment row / duplicate emails where guarded |
| PDF | Large resume content | PDF renders; generation error handled |
| Admin | Direct URL `/admin` as normal user | Redirect to `/app` |
| Mobile | iOS Safari preview + checkout | Readable; safe-area padding OK |

---

## Known limitations (MVP)

1. **Webhook idempotency by Stripe event ID** — Duplicate `checkout.session.completed` deliveries are safe for **order completion** because updates short-circuit when `order.status === "completed"`. There is no separate `stripe_events` deduplication table; other event types are mostly ignored.
2. **Autosave debounce** — Up to ~900ms of edits may not be persisted if the tab is killed immediately (browser `beforeunload` cannot reliably await server actions).
3. **Checkout return without `session_id`** — Treated as `missing_session`; user must return from Stripe with query params or open preview again.
4. **Polling vs webhook** — Download unlock is **authoritative from server/webhook**; client polling is UX-only and can time out while webhook still succeeds later.
5. **AI logging** — If `ai_generation_logs` insert fails, user flow continues; ops may have gaps.
6. **Session refresh in Server Components** — Cookie mutation can fail in some RSC contexts (comment in `createSupabaseServerClient`); middleware/proxy mitigates refresh for navigation.

---

## Deployment notes — Vercel

1. Connect the Git repo; set **Root** if monorepo; framework **Next.js**.
2. **Environment variables**: Copy from `.env.example`; set **Production** and **Preview** as needed (Preview may use Stripe test mode + Supabase branch).
3. **Domains**: Add production domain; ensure `NEXT_PUBLIC_APP_URL` matches the canonical URL (used in emails, Stripe redirects, metadata).
4. **Functions**: Webhook route uses **Node.js** runtime (`export const runtime = "nodejs"`).
5. **Stripe webhook URL**: `https://<your-domain>/api/webhooks/stripe` — same path in Stripe Dashboard; paste signing secret into `STRIPE_WEBHOOK_SECRET`.
6. **Cron / background**: Not required for core MVP; webhooks drive payment state.

---

## Deployment notes — Supabase

1. Run migrations (`supabase db push` or SQL from `supabase/migrations`) against the **production** project.
2. **Auth** → URL configuration: Site URL and redirect URLs include production app URL and `/auth/callback`.
3. **Storage**: `resume-pdfs` bucket exists with policies aligned to service-role uploads and user-scoped access as designed.
4. **RLS**: Confirm policies for `profiles`, `resume_projects`, `orders`, etc., match app expectations; admin paths using service role bypass RLS only in trusted server code.
5. **Backups**: Enable Point-in-Time Recovery (paid tier) for production if required by policy.

---

## Post-launch monitoring recommendations

### Metrics & logs

- **Vercel**: Request volume, **5xx rate**, function duration (especially webhook and PDF generation).
- **Stripe Dashboard**: Successful payments, failed payments, webhook delivery failures and retries.
- **Supabase**: Database size, connection count, slow queries, auth errors spike.

### Alerts (suggested)

- Sentry: New issue spike, or specific tags for `stripe webhook`, `resume-pdf`.
- Uptime: Synthetic check on `/` and `/api/health`.
- Stripe: Webhook endpoint failure rate above threshold.

### Product analytics

- Funnel: signup → first project → checkout started → paid (if `ANALYTICS_*` enabled).
- AI usage: `ai_generation_logs` / admin AI page for cost and error codes.

### Security

- Review Supabase **Auth** logs for brute force patterns.
- Rotate API keys if leaked; Stripe supports rolling keys.

---

## Code references (recent hardening)

- `src/proxy.ts` — Auth boundaries + admin role check.
- `src/lib/supabase/map-postgrest-error.ts` — Session/expiry messaging for saves.
- `src/app/api/webhooks/stripe/route.ts` — Verify vs process; HTTP status codes for Stripe retries.
- `src/services/billing/stripe-webhook.ts` — Order completion idempotency and audit log.
