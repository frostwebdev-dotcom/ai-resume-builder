import { describe, expect, it } from "vitest";

import { createDemoWizardState } from "@/lib/resume-wizard/demo-wizard-state";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";

describe("createDemoWizardState", () => {
  it("validates and maps to a full preview document", () => {
    const w = createDemoWizardState();
    expect(w.personal.givenName.length).toBeGreaterThan(0);
    expect(w.experience.entries.length).toBeGreaterThanOrEqual(2);
    const doc = mapWizardToPreviewDocument(w, { avatarUrl: null });
    expect(doc.identity.fullName).toContain("Alex");
    expect(doc.summary).toBeTruthy();
    expect(doc.experience.length).toBeGreaterThanOrEqual(2);
  });
});
