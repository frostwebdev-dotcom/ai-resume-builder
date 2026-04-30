/**
 * Normalized resume document for templates and future PDF export.
 * Keeps layout components free of wizard-specific shapes.
 */
export type ResumeContactLine = {
  label?: string;
  value: string;
};

export type ResumeExperienceBlock = {
  id: string;
  title: string;
  company: string;
  location: string;
  dateRange: string;
  highlights: string[];
};

export type ResumeEducationBlock = {
  id: string;
  school: string;
  degreeLine: string;
  dateRange: string;
  details: string | null;
};

export type ResumeCertificationBlock = {
  id: string;
  name: string;
  issuer: string;
  dateLine: string;
};

export type ResumeProjectBlock = {
  id: string;
  name: string;
  url: string | null;
  description: string;
  technologies: string;
};

/** Hard page breaks before these blocks (preview print + PDF). */
export type ResumePreviewPageBreakKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "additional"
  | "languages"
  | "hobbies"
  | "courses"
  | "internships";

/** Guest-studio freeform blocks (languages, hobbies, …) in sidebar order. */
export type ResumeSupplementarySectionId =
  | "languages"
  | "hobbies"
  | "courses"
  | "internships";

/** Main + rail blocks (excludes `personal` — rendered with contact/header). */
export type ResumePreviewBodyBlockId =
  | "summary"
  | "education"
  | "experience"
  | "skills"
  | "languages"
  | "hobbies"
  | "courses"
  | "internships"
  | "certifications"
  | "projects"
  | "additional";

export type ResumeSupplementarySection = {
  id: ResumeSupplementarySectionId;
  title: string;
  body: string;
};

export type ResumePreviewPageBreaks = Partial<Record<ResumePreviewPageBreakKey, boolean>>;

export type ResumePreviewDocument = {
  v: 1;
  identity: {
    fullName: string;
    headline: string;
    /**
     * Resolved avatar URL for preview rendering (short-lived signed URL)
     * or null when no avatar is uploaded. Only consumed by templates whose
     * `layoutFamily` supports a photo (sidebar / photo-banner).
     */
    avatarUrl?: string | null;
    /**
     * Controls header vs contact placement for the name (guest studio control).
     */
    namePlacement?: "title" | "personal" | "both";
  };
  contact: {
    lines: ResumeContactLine[];
  };
  /**
   * Optional personal fields (DOB, license, …) — same data as the studio
   * "Optional fields" pills; rendered near contact/header, not after body sections.
   */
  personalOptionalLines: ResumeContactLine[];
  /** Languages, hobbies, courses, internships — each with its own heading, in form order. */
  supplementarySections: ResumeSupplementarySection[];
  /**
   * Preview/PDF section order from the studio (excluding personal).
   * Sidebar templates render `skills` / `certifications` in the left rail; other ids in the main column.
   */
  bodySectionOrder: ResumePreviewBodyBlockId[];
  summary: string | null;
  skills: string[];
  experience: ResumeExperienceBlock[];
  education: ResumeEducationBlock[];
  certifications: ResumeCertificationBlock[];
  projects: ResumeProjectBlock[];
  /** Free-form "Additional information" notes only (not languages/hobbies). */
  additional: string | null;
  /** When set, forces a new page before the given body section (if that section renders). */
  pageBreakBefore?: ResumePreviewPageBreaks | null;
  completeness: {
    hasName: boolean;
    filledSections: string[];
  };
};
