import type { ResumePreviewDocument } from "@/lib/resume-preview/model";

/** True when the candidate name should appear in the header / title region. */
export function nameShowsInResumeHeader(
  identity: ResumePreviewDocument["identity"],
): boolean {
  const p = identity.namePlacement ?? "title";
  return p === "title" || p === "both";
}
