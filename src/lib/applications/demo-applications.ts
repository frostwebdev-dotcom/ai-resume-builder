/** Demo rows for the in-app Applications tracker (no persistence yet). */

export type ApplicationStatus =
  | "Applied"
  | "Phone screen"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type DemoApplication = {
  id: string;
  company: string;
  roleTitle: string;
  status: ApplicationStatus;
  appliedLabel: string;
  /** Short next step or empty */
  nextStep: string;
  logo: {
    letter: string;
    className: string;
  };
};

export const DEMO_APPLICATIONS: DemoApplication[] = [
  {
    id: "app-1",
    company: "Nordstrom",
    roleTitle: "Retail Sales or Stock — Downtown Seattle Rack",
    status: "Interview",
    appliedLabel: "Apr 8, 2026",
    nextStep: "On-site panel Apr 24",
    logo: { letter: "N", className: "bg-slate-900 text-white" },
  },
  {
    id: "app-2",
    company: "Amazon Web Services",
    roleTitle: "Senior Product Manager, EC2",
    status: "Phone screen",
    appliedLabel: "Apr 12, 2026",
    nextStep: "Recruiter call scheduled",
    logo: { letter: "A", className: "bg-orange-600 text-white" },
  },
  {
    id: "app-3",
    company: "Starbucks",
    roleTitle: "Barista — Capitol Hill",
    status: "Applied",
    appliedLabel: "Apr 18, 2026",
    nextStep: "Awaiting confirmation email",
    logo: { letter: "S", className: "bg-emerald-800 text-white" },
  },
  {
    id: "app-4",
    company: "Regional Health Network",
    roleTitle: "Clinical Operations Coordinator",
    status: "Rejected",
    appliedLabel: "Mar 22, 2026",
    nextStep: "",
    logo: { letter: "R", className: "bg-teal-700 text-white" },
  },
  {
    id: "app-5",
    company: "FinStack",
    roleTitle: "Senior Frontend Engineer",
    status: "Offer",
    appliedLabel: "Mar 5, 2026",
    nextStep: "Respond by Apr 25",
    logo: { letter: "F", className: "bg-indigo-700 text-white" },
  },
  {
    id: "app-6",
    company: "The Postal Service",
    roleTitle: "City Carrier Assistant",
    status: "Withdrawn",
    appliedLabel: "Feb 1, 2026",
    nextStep: "Withdrew after accepting another role",
    logo: { letter: "T", className: "bg-blue-800 text-white" },
  },
];

export const APPLICATION_STATUS_OPTIONS: ApplicationStatus[] = [
  "Applied",
  "Phone screen",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];
