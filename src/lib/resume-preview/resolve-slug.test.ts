import { describe, expect, it } from "vitest";

import { templateIdToSlug } from "./resolve-slug";
import { TEMPLATE_IDS, DEFAULT_TEMPLATE_ID } from "./template-ids";
import { ALL_TEMPLATE_THEMES, getTemplateTheme } from "./template-theme";

describe("templateIdToSlug", () => {
  it("maps each known template id to its slug", () => {
    expect(templateIdToSlug(TEMPLATE_IDS.athena)).toBe("athena");
    expect(templateIdToSlug(TEMPLATE_IDS.meridian)).toBe("meridian");
    expect(templateIdToSlug(TEMPLATE_IDS.nova)).toBe("nova");
  });

  it("falls back to athena for unknown or missing ids", () => {
    expect(templateIdToSlug(null)).toBe("athena");
    expect(templateIdToSlug(undefined)).toBe("athena");
    expect(templateIdToSlug("not-a-real-id")).toBe("athena");
    expect(templateIdToSlug(DEFAULT_TEMPLATE_ID)).toBe("athena");
  });
});

describe("getTemplateTheme", () => {
  it("exposes a theme for every template slug", () => {
    expect(ALL_TEMPLATE_THEMES).toHaveLength(3);
    for (const t of ALL_TEMPLATE_THEMES) {
      expect(t.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentStrong).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.pageMarginPt).toBeGreaterThan(20);
      expect(t.type.body).toBeGreaterThan(0);
    }
  });

  it("returns athena theme for unknown slugs via fallback", () => {
    expect(getTemplateTheme("athena").slug).toBe("athena");
    expect(getTemplateTheme("meridian").slug).toBe("meridian");
    expect(getTemplateTheme("nova").slug).toBe("nova");
  });
});
