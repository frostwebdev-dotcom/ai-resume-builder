# Resume flow QA

Manual release-gate checks for the AI Resume Builder. Run these against the production candidate after automated CI is green.

## Guest flow

- Open `/create` in a clean browser session.
- Confirm the resume editor loads without authentication.
- Enter profile, summary, experience, education, and skills content.
- Confirm undo/redo and template selection work.
- Reload the page and confirm the guest draft is restored.
- Confirm AI controls render; exercise AI generation only when the production OpenAI key is configured.
- Confirm the preview is readable on desktop and mobile widths.

## Account flow

- Sign up with a new account and complete email verification when enabled.
- Sign out and sign back in.
- Exercise password reset end-to-end.
- Import a guest draft into the authenticated account.
- Edit a saved project and confirm autosave reaches the Saved state.
- Reload and confirm the saved project is unchanged.
- Verify a second user cannot access the first user's project URL or download.

## Payment and download

- Start checkout from a completed resume using Stripe test mode.
- Cancel checkout and confirm the resume remains locked.
- Complete checkout with a Stripe test card.
- Confirm the Stripe webhook completes the order.
- Confirm PDF download unlocks only after the server records payment.
- Replay the completed webhook and confirm no duplicate entitlement or payment side effect.
- Confirm an unpaid user receives a payment-required response.

## Admin and security

- Confirm a normal user cannot open `/admin`.
- Confirm an admin can open required admin pages.
- Confirm no service-role, Stripe secret, OpenAI key, or webhook secret is exposed in browser assets.
- Confirm Supabase RLS is enabled for user-owned data tables.
- Confirm `/api/health` returns HTTP 200.

## Release decision

Do not switch Stripe to live mode until automated CI is green and every applicable check above has passed in the production candidate environment.
