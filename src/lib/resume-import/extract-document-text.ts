import "server-only";

import mammoth from "mammoth";

/* CJS module — default typing varies by bundler. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  data: Buffer,
) => Promise<{ text?: string; numpages?: number }>;

const MAX_BYTES = 9 * 1024 * 1024;

export type SupportedResumeMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractResumePlainText(
  buffer: Buffer,
  mimeType: SupportedResumeMime,
): Promise<{ text: string; pageCount?: number }> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (mimeType === "application/pdf") {
    const res = await pdfParse(buffer);
    const text = normalizeWhitespace(res.text ?? "");
    return { text, pageCount: typeof res.numpages === "number" ? res.numpages : undefined };
  }

  const docx = await mammoth.extractRawText({ buffer });
  const text = normalizeWhitespace(docx.value ?? "");
  return { text };
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
