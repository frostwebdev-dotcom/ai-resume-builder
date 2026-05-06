import "server-only";

import mammoth from "mammoth";

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
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const res = await parser.getText();
      const text = normalizeWhitespace(res.text ?? "");
      const pageCount =
        typeof res.total === "number" && res.total > 0
          ? res.total
          : Array.isArray(res.pages)
            ? res.pages.length
            : undefined;
      return { text, pageCount };
    } finally {
      await parser.destroy();
    }
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
