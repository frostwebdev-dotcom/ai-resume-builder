import { describe, expect, it } from "vitest";

import {
  isProfileDescriptionEmpty,
  looksLikeProfileHtml,
  profileHtmlToPlainText,
  sanitizeProfileDescriptionHtml,
} from "@/lib/profile-description-html";

describe("profile-description-html", () => {
  it("detects stored HTML vs plain text", () => {
    expect(looksLikeProfileHtml("Hello world")).toBe(false);
    expect(looksLikeProfileHtml("3 < 5")).toBe(false);
    expect(looksLikeProfileHtml("<p>Hi</p>")).toBe(true);
    expect(looksLikeProfileHtml("<strong>Hi</strong>")).toBe(true);
  });

  it("sanitizes allow-listed tags and strips attributes", () => {
    const raw = '<p class="x" style="color:red">A <strong onclick="evil()">B</strong></p>';
    const out = sanitizeProfileDescriptionHtml(raw);
    expect(out).toContain("<p>");
    expect(out).toContain("<strong>");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("style=");
  });

  it("removes script blocks", () => {
    const raw = 'Hi<script>alert(1)</script><strong>There</strong>';
    const out = sanitizeProfileDescriptionHtml(raw);
    expect(out.toLowerCase()).not.toContain("script");
    expect(out).toContain("There");
  });

  it("flattens to plain text for PDF", () => {
    expect(profileHtmlToPlainText("<p>Line one</p><br />Line two")).toContain("Line one");
    expect(profileHtmlToPlainText("<p>Line one</p><br />Line two")).toContain("Line two");
  });

  it("treats empty or whitespace-only HTML as empty", () => {
    expect(isProfileDescriptionEmpty("")).toBe(true);
    expect(isProfileDescriptionEmpty("   ")).toBe(true);
    expect(isProfileDescriptionEmpty("<p><br /></p>")).toBe(true);
    expect(isProfileDescriptionEmpty("<p>Real</p>")).toBe(false);
  });

  it("treats list-only markup as non-empty so lists are not cleared", () => {
    expect(isProfileDescriptionEmpty("<ul><li><br></li></ul>")).toBe(false);
    expect(isProfileDescriptionEmpty("<ol><li></li></ol>")).toBe(false);
  });

  it("keeps safe links and drops unsafe hrefs", () => {
    const good = sanitizeProfileDescriptionHtml(
      '<a href="https://example.com/path">x</a>',
    );
    expect(good).toContain("https://example.com/path");
    expect(good).toContain("noopener");
    const bad = sanitizeProfileDescriptionHtml('<a href="javascript:alert(1)">x</a>');
    expect(bad).not.toContain("javascript:");
  });

  it("preserves only safe text-align on blocks", () => {
    const out = sanitizeProfileDescriptionHtml(
      '<p style="text-align: center; margin: 0">C</p>',
    );
    expect(out).toContain('style="text-align: center"');
    expect(out).not.toContain("margin");
  });
});
