"use client";

import { useState } from "react";

import { ResumeWizard } from "@/components/resume-wizard/resume-wizard";
import { loadGuestWizardDraftFromStorage } from "@/hooks/use-guest-wizard-autosave";
import { createEmptyWizardState } from "@/lib/resume-wizard/defaults";
import { GUEST_RESUME_PROJECT_ID } from "@/lib/constants";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID } from "@/lib/resume-preview/template-ids";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";

/**
 * Client-only resume builder (mounted via `next/dynamic` with `{ ssr: false }` so the initial
 * state initializer runs only in the browser and can read `localStorage` without hydration mismatch).
 */
export function GuestCreateClient() {
  const [initialState] = useState(
    () => loadGuestWizardDraftFromStorage() ?? createEmptyWizardState(),
  );

  const templateSlug = templateIdToSlug(DEFAULT_TEMPLATE_ID);

  return (
    <ResumeWizard
      key="guest-resume-wizard"
      guestMode
      projectId={GUEST_RESUME_PROJECT_ID}
      projectTitle="My resume"
      initialState={initialState}
      initialJobTarget={null}
      templateSlug={templateSlug}
      initialResumeStyle={DEFAULT_RESUME_STYLE_V1}
      avatarSignedUrl={null}
    />
  );
}
