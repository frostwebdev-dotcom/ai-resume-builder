/** Client-side id for stable React keys (not persisted separately). */
export type EntryId = string;

export type PersonalDetails = {
  /**
   * Derived or legacy full name for preview/PDF — kept in sync when
   * givenName/familyName are edited in the guest personal editor.
   */
  fullName: string;
  givenName: string;
  familyName: string;
  /** Guest photo — data URL or empty (local preview only unless exported). */
  photoDataUrl: string;
  desiredJobPosition: string;
  /** When true, preview headline uses `desiredJobPosition` instead of Profile headline. */
  useJobPositionAsHeadline: boolean;
  email: string;
  phone: string;
  /** Street address line (new structured layout). */
  address: string;
  postCode: string;
  city: string;
  /** Legacy / fallback single line (e.g. "Berlin · Remote"). */
  location: string;
  linkedIn: string;
  website: string;
  dateOfBirth: string;
  placeOfBirth: string;
  driversLicense: string;
  gender: string;
  nationality: string;
  civilStatus: string;
  customFieldLabel: string;
  customFieldValue: string;
  /**
   * Where the candidate name appears on the resume preview / PDF.
   * `title` — main header only; `personal` — contact / personal block only;
   * `both` — header and as a labeled contact line.
   */
  showNameIn: "title" | "personal" | "both";
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
  /** One entry per line — shown as Languages in the guest studio list. */
  languages: SkillsBlock;
  hobbies: SkillsBlock;
  courses: SkillsBlock;
  /** One role per block of lines (guest studio); maps to preview additional text. */
  internships: SkillsBlock;
  certifications: { entries: CertificationEntry[] };
  projects: { entries: ProjectEntry[] };
  additional: AdditionalInfo;
};
