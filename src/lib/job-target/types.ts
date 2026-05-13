/**
 * Stored under `job_targets.metadata.tailoring_compare` for accept/reject UX.
 */
export type TailoringCompareV1 = {
  v: 1;
  summary?: SectionCompare<{
    headline: string;
    summary: string;
  }>;
  skills?: SectionCompare<{ lines: string }>;
  /** Keyed by experience entry id */
  experience?: Record<string, SectionCompare<{ bullets: string[] }>>;
};

export type SectionCompare<T> = {
  before: T;
  after: T;
  generatedAt: string;
};

/** Stored under `job_targets.metadata.job_tailor_review` after a full pipeline run. */
export type JobTailorReviewV1 = {
  v: 1;
  generatedAt: string;
  alignmentHighlights: string[];
  improvementIdeas: string[];
};
