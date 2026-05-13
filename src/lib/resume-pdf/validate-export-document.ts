import type { ResumePreviewDocument } from "@/lib/resume-preview/model";

/**
 * Blocks exporting a nearly empty PDF (bad UX and some renderers edge-case badly).
 * Preview can still show an empty shell; paid export should require minimal substance.
 */
export function describeResumeExportReadiness(
  doc: ResumePreviewDocument,
): { ok: true } | { ok: false; message: string } {
  const filled = doc.completeness.filledSections;
  if (filled.length === 0) {
    return {
      ok: false,
      message:
        "Add your name or at least one resume section in Draft before downloading. The PDF is built from the same content as preview.",
    };
  }
  return { ok: true };
}

/** Validates PDFKit output before upload (truncated/corrupt buffers). */
export function isPlausiblePdfBuffer(buf: Buffer): boolean {
  if (!buf || buf.length < 200) return false;
  const head = buf.subarray(0, 5).toString("latin1");
  return head.startsWith("%PDF-");
}
