import { describe, expect, it } from "vitest";

import { templateIdToSlug } from "./resolve-slug";
import {
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_SLUG,
  isTemplateSlug,
  TEMPLATE_IDS,
  TEMPLATE_SLUG_ORDER,
} from "./template-ids";
import { ALL_TEMPLATE_THEMES, getTemplateTheme } from "./template-theme";

describe("templateIdToSlug", () => {
  it("maps each known template id to its slug", () => {
    for (const slug of TEMPLATE_SLUG_ORDER) {
      expect(templateIdToSlug(TEMPLATE_IDS[slug])).toBe(slug);
    }
  });

  it("falls back to the default launch slug for unknown or missing ids", () => {
    expect(templateIdToSlug(null)).toBe(DEFAULT_TEMPLATE_SLUG);
    expect(templateIdToSlug(undefined)).toBe(DEFAULT_TEMPLATE_SLUG);
    expect(templateIdToSlug("not-a-real-id")).toBe(DEFAULT_TEMPLATE_SLUG);
    expect(templateIdToSlug(DEFAULT_TEMPLATE_ID)).toBe(DEFAULT_TEMPLATE_SLUG);
  });
});

describe("isTemplateSlug", () => {
  it("accepts every known slug", () => {
    for (const slug of TEMPLATE_SLUG_ORDER) {
      expect(isTemplateSlug(slug)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isTemplateSlug("bogus")).toBe(false);
    expect(isTemplateSlug("")).toBe(false);
  });
});

describe("template themes", () => {
  it("exposes a well-formed theme for every slug", () => {
    expect(ALL_TEMPLATE_THEMES).toHaveLength(TEMPLATE_SLUG_ORDER.length);
    expect(TEMPLATE_SLUG_ORDER.length).toBe(3);
    for (const theme of ALL_TEMPLATE_THEMES) {
      expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.accentStrong).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.pageMarginPt).toBeGreaterThan(20);
      expect(theme.type.body).toBeGreaterThan(0);
      expect(theme.pickerTagline.length).toBeGreaterThan(0);
      expect(theme.bestFor.length).toBeGreaterThan(0);
      expect(["sans", "serif"]).toContain(theme.fontFamily);
      expect(["centered", "split", "compact", "banner"]).toContain(theme.headerStyle);
      expect(theme.layoutFamily).toBe("classic");
    }
  });

  it("resolves a theme per slug with the matching .slug field", () => {
    for (const slug of TEMPLATE_SLUG_ORDER) {
      expect(getTemplateTheme(slug).slug).toBe(slug);
    }
  });
});
