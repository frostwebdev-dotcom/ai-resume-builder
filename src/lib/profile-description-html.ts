const ALLOWED = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "br",
  "ul",
  "ol",
  "li",
  "p",
  "div",
]);

/**
 * Detect stored profile HTML (vs plain text). Avoids treating "a < b" as HTML.
 */
export function looksLikeProfileHtml(input: string): boolean {
  return /<\/?(strong|em|u|b|i|a|br|ul|ol|li|p|div)\b/i.test(input);
}

const TEXT_ALIGN_VALUES = new Set(["left", "center", "right"]);

function extractSafeTextAlign(fullTag: string): string | null {
  const m = fullTag.match(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (!m) return null;
  const style = (m[2] ?? m[3] ?? "").toLowerCase();
  const ta = style.match(/text-align\s*:\s*(left|center|right)/i);
  const v = ta?.[1]?.toLowerCase();
  return v && TEXT_ALIGN_VALUES.has(v) ? v : null;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractSafeHref(fullTag: string): string | null {
  const m = fullTag.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!m) return null;
  const raw = (m[2] ?? m[3] ?? m[4] ?? "").trim();
  if (!raw || /^javascript:/i.test(raw) || /^data:/i.test(raw)) return null;
  if (!/^https:\/\//i.test(raw) && !/^http:\/\//i.test(raw)) return null;
  return raw;
}

function stripDangerousBlocks(html: string): string {
  return html
    .replace(/\0/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(
      /<(img|input|form|button|video|audio|source|canvas|object|embed|link|meta|svg|base)\b[^>]*\/?>/gi,
      "",
    );
}

/**
 * Allow-list tags, drop attributes, normalize b/i to strong/em. Safe for SSR + PDF plain conversion.
 */
export function sanitizeProfileDescriptionHtml(input: string): string {
  const s = stripDangerousBlocks(input);

  return s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g, (full, name: string) => {
    const t = name.toLowerCase();
    const isClose = /^<\//.test(full);

    if (t === "br") {
      return "<br />";
    }

    if (!ALLOWED.has(t)) {
      return "";
    }

    if (t === "b") {
      return isClose ? "</strong>" : "<strong>";
    }
    if (t === "strong") {
      return isClose ? "</strong>" : "<strong>";
    }
    if (t === "i") {
      return isClose ? "</em>" : "<em>";
    }
    if (t === "em") {
      return isClose ? "</em>" : "<em>";
    }
    if (t === "u") {
      return isClose ? "</u>" : "<u>";
    }
    if (t === "ul") {
      return isClose ? "</ul>" : "<ul>";
    }
    if (t === "ol") {
      return isClose ? "</ol>" : "<ol>";
    }
    if (t === "li") {
      return isClose ? "</li>" : "<li>";
    }
    if (t === "p") {
      if (isClose) return "</p>";
      const align = extractSafeTextAlign(full);
      if (align) return `<p style="text-align: ${align}">`;
      return "<p>";
    }
    if (t === "div") {
      if (isClose) return "</div>";
      const align = extractSafeTextAlign(full);
      if (align) return `<div style="text-align: ${align}">`;
      return "<div>";
    }
    if (t === "a") {
      if (isClose) return "</a>";
      const href = extractSafeHref(full);
      if (!href) return "";
      return `<a href="${escapeHtmlAttr(href)}" rel="noopener noreferrer" target="_blank">`;
    }

    return "";
  });
}

export function plainTextToProfileDisplayHtml(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withBr = esc.replace(/\r\n|\n|\r/g, "<br />");
  return withBr.length > 0 ? withBr : "<br />";
}

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m) => {
      const inner = m.slice(1, -1).toLowerCase();
      if (inner.startsWith("#x")) {
        const code = Number.parseInt(inner.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      if (inner.startsWith("#")) {
        const code = Number.parseInt(inner.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITY_MAP[inner] ?? m;
    })
    .replace(/&nbsp;/gi, " ");
}

/** Flatten profile HTML to plain text for PDFKit and fallbacks. */
export function profileHtmlToPlainText(input: string): string {
  const s = sanitizeProfileDescriptionHtml(input);
  const withBreaks = s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeBasicEntities(withBreaks).replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * True when there is no user-visible text *and* no list structure.
 * List-only markup (e.g. `<ul><li><br></li></ul>`) is **not** empty — otherwise
 * contentEditable list commands get wiped on the next `input` event.
 */
export function isProfileDescriptionEmpty(input: string): boolean {
  const s = sanitizeProfileDescriptionHtml(input.trim());
  if (/<\s*(ul|ol)\b/i.test(s)) {
    return false;
  }
  return profileHtmlToPlainText(input).length === 0;
}
