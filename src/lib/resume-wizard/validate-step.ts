import { personalStepSchema } from "@/lib/resume-wizard/schema";
import type { WizardStepId } from "@/lib/resume-wizard/steps";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

/**
 * Block "Next" only when the current section has blocking issues (Personal: name + email).
 */
export function validateStepForNavigation(
  stepId: WizardStepId,
  state: WizardStateV1,
): { ok: true } | { ok: false; message: string } {
  if (stepId === "personal") {
    const r = personalStepSchema.safeParse(state.personal);
    if (!r.success) {
      const e = r.error.flatten().fieldErrors;
      const first =
        e.fullName?.[0] ??
        e.email?.[0] ??
        e.phone?.[0] ??
        e.location?.[0] ??
        e.linkedIn?.[0] ??
        e.website?.[0] ??
        "Check this section before continuing.";
      return { ok: false, message: first };
    }
  }
  return { ok: true };
}
