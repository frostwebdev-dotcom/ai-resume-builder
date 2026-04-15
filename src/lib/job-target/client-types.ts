import type { TailoringCompareV1 } from "@/lib/job-target/types";

/** Serializable job target + tailoring preview for the resume builder (RSC → client). */
export type JobTargetClientView = {
  title: string | null;
  company: string | null;
  jobDescription: string | null;
  tailoringCompare: TailoringCompareV1 | null;
};
