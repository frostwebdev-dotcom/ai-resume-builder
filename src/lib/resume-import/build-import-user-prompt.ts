import "server-only";

import type { SupportedResumeMime } from "@/lib/resume-import/extract-document-text";

const MAX_PROMPT_CHARS = 95_000;

export function buildResumeImportUserPrompt(params: {
  fileName: string;
  mimeType: SupportedResumeMime;
  plainText: string;
}): string {
  let body = params.plainText;
  if (body.length > MAX_PROMPT_CHARS) {
    const head = body.slice(0, 65_000);
    const tail = body.slice(-25_000);
    body = `${head}\n\n[… middle of document omitted for model context …]\n\n${tail}`;
  }

  return `File name: ${params.fileName}
MIME type: ${params.mimeType}

Map the following résumé plain text into the JSON object described in your system instructions. Use only facts stated in the text.

---BEGIN_RESUME_TEXT---
${body}
---END_RESUME_TEXT---`;
}
