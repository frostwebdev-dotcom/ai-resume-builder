# AI Resume Builder

Production-oriented foundation for a SaaS that lets users build and preview resumes for free, then pay to download the final PDF. This repository contains the **project scaffold only** — integrations are wired at the library/service layer without full product flows.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** with **shadcn/ui** (Base UI + neutral theme tokens)
- **Supabase** — Postgres, Auth, Storage (client/server helpers in `src/lib/supabase`)
- **Stripe** — payments (server SDK in `src/lib/stripe`, webhook stub under `src/app/api/webhooks/stripe`)
- **OpenAI** — AI generation (`src/services/ai`)
- **Resend** — email (`src/services/email`)
- **Sentry** — error monitoring (`sentry.*.config.ts`, `src/instrumentation.ts`)
- **Upstash Redis** — rate limiting helper (`src/lib/redis/rate-limit.ts`)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Marketing routes live at `/`, the authenticated shell at `/app`, and the admin shell at `/admin`.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | ESLint                   |

## Environment variables

See `.env.example` for the full list. Secrets must never use the `NEXT_PUBLIC_` prefix. Validate and consume server values through `src/lib/env.ts` (server-only) and Zod schemas in `src/validation/env.ts`.

## Launch QA & operations

See **[docs/LAUNCH_READINESS.md](docs/LAUNCH_READINESS.md)** for QA checklists, test cases, deployment notes (Vercel + Supabase), known limitations, and monitoring recommendations.

## Tailwind and theming

Tailwind v4 is configured via CSS in `src/app/globals.css` (`@import "tailwindcss"`, `@theme`, shadcn tokens). The default experience is a **clean light** SaaS look; dark mode is available through `next-themes` (`class="dark"` on `<html>`) with tokens already defined under `.dark` in the same file.

## Sentry

Set `NEXT_PUBLIC_SENTRY_DSN` to enable the SDK. For source map uploads in CI, configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`, then wrap `next.config.ts` with `withSentryConfig` from `@sentry/nextjs` when you are ready for production uploads.

## Project layout (high level)

- `src/app/(marketing)` — public marketing site  
- `src/app/(app)/app` — authenticated product area (`/app`, `/app/resume`)  
- `src/app/(admin)/admin` — admin UI (`/admin`)  
- `src/components` — shared UI (layout, providers, shadcn `ui/`)  
- `src/features` — feature-oriented modules (e.g. `features/resume`)  
- `src/services` — business logic and external API orchestration  
- `src/lib` — env, Supabase/Stripe/Redis helpers, constants  
- `src/validation` — Zod schemas (env, shared fields)  
- `src/types` — shared TypeScript types (`database.ts` matches `supabase/migrations`; regenerate with Supabase CLI when the schema changes)  
- `src/hooks` — client hooks  
- `src/proxy.ts` — Next.js 16 request boundary (replaces deprecated `middleware` naming)  
- `supabase/migrations` — Postgres schema, RLS, auth trigger; storage buckets + object policies  

### Supabase database

Apply migrations locally or on the hosted project (`supabase db push` or paste SQL in the SQL editor). Use the **anon** key in the browser and server user client; use the **service role** key only in trusted server code (`src/lib/supabase/service-role.ts`) for webhooks and background writes that bypass RLS.

## License

Private — all rights reserved unless otherwise stated.
