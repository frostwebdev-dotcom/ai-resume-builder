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
  };
  contact: {
    lines: ResumeContactLine[];
  };
  summary: string | null;
  skills: string[];
  experience: ResumeExperienceBlock[];
  education: ResumeEducationBlock[];
  certifications: ResumeCertificationBlock[];
  projects: ResumeProjectBlock[];
  additional: string | null;
  completeness: {
    hasName: boolean;
    filledSections: string[];
  };
};
