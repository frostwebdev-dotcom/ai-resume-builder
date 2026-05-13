import { describe, expect, it } from "vitest";

import { DEFAULT_TEMPLATE_SLUG, TEMPLATE_SLUG_ORDER } from "@/lib/resume-preview/template-ids";
import {
  createDemoWizardState,
  createDemoWizardStateForTemplate,
  getDemoAvatarUrlForTemplate,
} from "@/lib/resume-wizard/demo-wizard-state";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";

describe("createDemoWizardState / createDemoWizardStateForTemplate", () => {
  it("default launch template validates and maps to a full preview document", () => {
    const w = createDemoWizardState();
    expect(w.personal.givenName.length).toBeGreaterThan(0);
    expect(w.experience.entries.length).toBeGreaterThanOrEqual(2);
    const doc = mapWizardToPreviewDocument(w, {
      avatarUrl: getDemoAvatarUrlForTemplate(DEFAULT_TEMPLATE_SLUG),
    });
    expect(doc.identity.fullName.length).toBeGreaterThan(0);
    expect(doc.summary).toBeTruthy();
    expect(doc.experience.length).toBeGreaterThanOrEqual(2);
    expect(doc.identity.avatarUrl).toBeNull();
  });

  it("each catalog slug yields a distinct demo identity", () => {
    const names = new Set<string>();
    for (const slug of TEMPLATE_SLUG_ORDER) {
      const w = createDemoWizardStateForTemplate(slug);
      expect(w.personal.email).toContain("@");
      names.add(`${w.personal.givenName}|${w.personal.familyName}`);
    }
    expect(names.size).toBe(TEMPLATE_SLUG_ORDER.length);
  });

  it("launch classic templates do not inject demo portrait URLs", () => {
    for (const slug of TEMPLATE_SLUG_ORDER) {
      expect(getDemoAvatarUrlForTemplate(slug)).toBeNull();
    }
  });
});
