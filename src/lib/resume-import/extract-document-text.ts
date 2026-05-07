import "server-only";

import mammoth from "mammoth";

const MAX_BYTES = 9 * 1024 * 1024;

export type SupportedResumeMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extracts plain text from a PDF or DOCX upload.
 *
 * Why `unpdf` for PDFs:
 * - Pure-JS PDF.js build with zero native deps. Works locally on Windows/macOS/Linux *and*
 *   on Vercel/AWS Lambda/Cloudflare. The previous `pdf-parse` v2 stack pulls in `pdfjs-dist`
 *   + `@napi-rs/canvas`, which fails to load native bindings in serverless runtimes
 *   ("Cannot polyfill DOMMatrix") and surfaces in the UI as
 *   "We could not read text from this file."
 *
 * Why `mammoth` for DOCX:
 * - Best-in-class plain-text extractor; no native deps.
 */
export async function extractResumePlainText(
  buffer: Buffer,
  mimeType: SupportedResumeMime,
): Promise<{ text: string; pageCount?: number }> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (mimeType === "application/pdf") {
    const { extractText } = await import("unpdf");
    const data = new Uint8Array(buffer);
    const { text, totalPages } = await extractText(data, { mergePages: true });
    const merged = Array.isArray(text) ? text.join("\n\n") : text;
    return { text: normalizeWhitespace(merged ?? ""), pageCount: totalPages };
  }

  const docx = await mammoth.extractRawText({ buffer });
  return { text: normalizeWhitespace(docx.value ?? "") };
}

function normalizeWhitespace(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
