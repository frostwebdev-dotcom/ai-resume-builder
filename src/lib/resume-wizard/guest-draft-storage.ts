/**
 * Browser-only guest wizard draft persistence (`/create`).
 *
 * **Envelope (v1):** `{ envelopeVersion: 1, updatedAt: ISO string, wizard: … }` so we can evolve
 * storage without losing migration paths, and record last-write time for debugging.
 *
 * **Legacy:** raw `WizardStateV1` JSON with top-level `v === 1` (still supported on read).
 *
 * **Migration to account:** After a successful `importGuestDraftToProjectAction`, the client calls
 * `clearGuestWizardDraftFromStorage()` (and presentation storage) so the same draft is not imported twice.
 * See `docs/guest-draft-migration.md`.
 */

import { hydrateWizardState } from "@/lib/resume-wizard/parse";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

export const GUEST_WIZARD_LOCAL_STORAGE_KEY = "resume-real-andy:guest-wizard-draft:v1";

type GuestWizardEnvelopeV1 = {
  envelopeVersion: 1;
  updatedAt: string;
  wizard: unknown;
};

function isEnvelopeV1(value: unknown): value is GuestWizardEnvelopeV1 {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return o.envelopeVersion === 1 && typeof o.updatedAt === "string" && "wizard" in o;
}

function isLegacyWizardBlob(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return "v" in value && (value as { v: unknown }).v === 1;
}

/**
 * Reads and hydrates the guest wizard draft from `localStorage`, or returns `null`.
 */
export function loadGuestWizardDraftFromStorage(): WizardStateV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_WIZARD_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isEnvelopeV1(parsed)) {
      return hydrateWizardState(parsed.wizard);
    }
    if (isLegacyWizardBlob(parsed)) {
      return hydrateWizardState(parsed);
    }
  } catch {
    /* ignore corrupt drafts */
  }
  return null;
}

/**
 * Persists the wizard under the canonical key using the v1 envelope (atomic replace).
 */
export function saveGuestWizardDraftToStorage(state: WizardStateV1): void {
  const envelope: GuestWizardEnvelopeV1 = {
    envelopeVersion: 1,
    updatedAt: new Date().toISOString(),
    wizard: state as unknown,
  };
  localStorage.setItem(GUEST_WIZARD_LOCAL_STORAGE_KEY, JSON.stringify(envelope));
}

/** Clears the guest wizard draft after a successful account import or explicit reset. */
export function clearGuestWizardDraftFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_WIZARD_LOCAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
