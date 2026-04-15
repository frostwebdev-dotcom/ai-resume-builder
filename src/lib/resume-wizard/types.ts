/** Client-side id for stable React keys (not persisted separately). */
export type EntryId = string;

export type PersonalDetails = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  website: string;
};

export type ProfessionalSummary = {
  headline: string;
  summary: string;
};

export type WorkExperienceEntry = {
  id: EntryId;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
};

export type EducationEntry = {
  id: EntryId;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  details: string;
};

export type SkillsBlock = {
  /** One skill per line in the UI; stored normalized. */
  lines: string;
};

export type CertificationEntry = {
  id: EntryId;
  name: string;
  issuer: string;
  issued: string;
  expires: string;
};

export type ProjectEntry = {
  id: EntryId;
  name: string;
  url: string;
  description: string;
  technologies: string;
};

export type AdditionalInfo = {
  notes: string;
};

export type WizardStateV1 = {
  v: 1;
  personal: PersonalDetails;
  summary: ProfessionalSummary;
  experience: { entries: WorkExperienceEntry[] };
  education: { entries: EducationEntry[] };
  skills: SkillsBlock;
  certifications: { entries: CertificationEntry[] };
  projects: { entries: ProjectEntry[] };
  additional: AdditionalInfo;
};
