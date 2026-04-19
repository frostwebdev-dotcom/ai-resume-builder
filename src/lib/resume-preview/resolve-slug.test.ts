import { describe, expect, it } from "vitest";

import { templateIdToSlug } from "./resolve-slug";
import { TEMPLATE_IDS, DEFAULT_TEMPLATE_ID, isTemplateSlug } from "./template-ids";
import { ALL_TEMPLATE_THEMES, getTemplateTheme } from "./template-theme";

const EXPECTED_SLUGS = [
  "athena",
  "meridian",
  "nova",
  "helios",
  "vanta",
  "lumen",
  "onyx",
  "clio",
] as const;

describe("templateIdToSlug", () => {
  it("maps each known template id to its slug", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(templateIdToSlug(TEMPLATE_IDS[slug])).toBe(slug);
    }
  });

  it("falls back to athena for unknown or missing ids", () => {
    expect(templateIdToSlug(null)).toBe("athena");
    expect(templateIdToSlug(undefined)).toBe("athena");
    expect(templateIdToSlug("not-a-real-id")).toBe("athena");
    expect(templateIdToSlug(DEFAULT_TEMPLATE_ID)).toBe("athena");
  });
});

describe("isTemplateSlug", () => {
  it("accepts every known slug", () => {
    for (const slug of EXPECTED_SLUGS) {
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
    expect(ALL_TEMPLATE_THEMES).toHaveLength(EXPECTED_SLUGS.length);
    for (const theme of ALL_TEMPLATE_THEMES) {
      expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.accentStrong).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.pageMarginPt).toBeGreaterThan(20);
      expect(theme.type.body).toBeGreaterThan(0);
      expect(theme.pickerTagline.length).toBeGreaterThan(0);
      expect(theme.bestFor.length).toBeGreaterThan(0);
      expect(["sans", "serif"]).toContain(theme.fontFamily);
      expect(["centered", "split", "compact", "banner"]).toContain(theme.headerStyle);
    }
  });

  it("resolves a theme per slug with the matching .slug field", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(getTemplateTheme(slug).slug).toBe(slug);
    }
  });
});
