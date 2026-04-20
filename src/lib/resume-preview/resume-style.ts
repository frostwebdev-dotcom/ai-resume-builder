import type { TemplateTheme } from "@/lib/resume-preview/template-theme";
import { templateSupportsAvatar } from "@/lib/resume-preview/template-theme";

/** Persisted per-project styling overrides (stored in `resume_projects.metadata.resume_style`). */
export type ResumeStyleV1 = {
  v: 1;
  /** Override template accent; null = use template default. */
  accent: string | null;
  accentStrong: string | null;
  /** null = follow template */
  fontFamily: "sans" | "serif" | null;
  bodyTextAlign: "left" | "center" | "justify" | null;
  headerTextAlign: "left" | "center" | "right" | null;
  /** Multiplier for default line height (1.15–1.75). */
  lineHeight: number | null;
  sectionGapScale: number | null;
  paragraphGapScale: number | null;
  /**
   * Whether to embed the uploaded avatar in templates that support one.
   * null = follow template default (true for sidebar / photo-banner families).
   * Classic templates never render photos regardless of this flag.
   */
  includeAvatar: boolean | null;
};

export const DEFAULT_RESUME_STYLE_V1: ResumeStyleV1 = {
  v: 1,
  accent: null,
  accentStrong: null,
  fontFamily: null,
  bodyTextAlign: null,
  headerTextAlign: null,
  lineHeight: null,
  sectionGapScale: null,
  paragraphGapScale: null,
  includeAvatar: null,
};

export type TextAlignBody = "left" | "center" | "justify";
export type TextAlignHeader = "left" | "center" | "right";

/** Fully resolved theme for preview + PDF (no nulls after merge). */
export type EffectiveResumeTheme = TemplateTheme & {
  accent: string;
  accentStrong: string;
  fontFamily: "sans" | "serif";
  bodyTextAlign: TextAlignBody;
  headerTextAlign: TextAlignHeader;
  lineHeight: number;
  sectionGapScale: number;
  paragraphGapScale: number;
  /**
   * Final resolution of whether the avatar should render for this template.
   * Combines template support with the user's `includeAvatar` override.
   * Classic templates can never set this to true.
   */
  showAvatar: boolean;
};

function defaultHeaderAlign(theme: TemplateTheme): TextAlignHeader {
  if (theme.headerStyle === "centered" || theme.headerStyle === "banner") return "center";
  if (theme.headerStyle === "split") return "left";
  return "left";
}

/**
 * Merges template defaults with optional user overrides from the database.
 */
export function mergeTemplateWithStyle(
  theme: TemplateTheme,
  style: ResumeStyleV1 | null | undefined,
): EffectiveResumeTheme {
  const s = style?.v === 1 ? style : null;
  const supportsAvatar = templateSupportsAvatar(theme);
  // Default: if the template has a place for an avatar, show it by default.
  const defaultInclude = supportsAvatar;
  const userInclude = s?.includeAvatar;
  const showAvatar =
    supportsAvatar && (userInclude === null || userInclude === undefined ? defaultInclude : userInclude);
  return {
    ...theme,
    accent: s?.accent?.trim() ?? theme.accent,
    accentStrong: s?.accentStrong?.trim() ?? theme.accentStrong,
    fontFamily: s?.fontFamily ?? theme.fontFamily,
    bodyTextAlign: s?.bodyTextAlign ?? "left",
    headerTextAlign: s?.headerTextAlign ?? defaultHeaderAlign(theme),
    lineHeight: s?.lineHeight ?? 1.45,
    sectionGapScale: s?.sectionGapScale ?? 1,
    paragraphGapScale: s?.paragraphGapScale ?? 1,
    showAvatar,
  };
}
