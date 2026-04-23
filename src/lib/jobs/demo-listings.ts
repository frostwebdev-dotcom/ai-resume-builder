/** Demo job rows for the in-app Jobs workspace (no external API yet). */

export type DemoJobListing = {
  id: string;
  company: string;
  title: string;
  snippet: string;
  locationLabel: string;
  employmentType: string;
  /** e.g. "147K–219K a year" — omit when unknown */
  salaryLabel?: string;
  postedLabel: string;
  logo: {
    letter: string;
    className: string;
  };
};

export const DEMO_JOB_LISTINGS: DemoJobListing[] = [
  {
    id: "nordstrom-rack",
    company: "Nordstrom",
    title: "Retail Sales or Stock — Downtown Seattle Rack",
    snippet:
      "Join our team in the heart of downtown Seattle. Flexible scheduling, employee discount, and growth opportunities in a fast-paced retail environment.",
    locationLabel: "Seattle, WA",
    employmentType: "Full-time",
    postedLabel: "Today",
    logo: { letter: "N", className: "bg-slate-900 text-white" },
  },
  {
    id: "aws-pm",
    company: "Amazon Web Services",
    title: "Senior Product Manager, EC2",
    snippet:
      "Own roadmap and delivery for core compute experiences. Partner with engineering and sales on customer-facing features and operational excellence.",
    locationLabel: "Seattle, WA",
    employmentType: "Full-time",
    salaryLabel: "147K–219K a year",
    postedLabel: "Today",
    logo: { letter: "A", className: "bg-orange-600 text-white" },
  },
  {
    id: "postal-carrier",
    company: "The Postal Service",
    title: "City Carrier Assistant",
    snippet:
      "Deliver mail and packages in assigned routes. Physical outdoor work in all weather; union position with benefits after probation.",
    locationLabel: "Seattle, WA",
    employmentType: "Full-time",
    postedLabel: "2 days ago",
    logo: { letter: "T", className: "bg-blue-800 text-white" },
  },
  {
    id: "starbucks-barista",
    company: "Starbucks",
    title: "Barista — Capitol Hill",
    snippet:
      "Create the Starbucks Experience for every customer while preparing beverages and food. Prior customer service experience preferred.",
    locationLabel: "Seattle, WA",
    employmentType: "Part-time",
    postedLabel: "3 days ago",
    logo: { letter: "S", className: "bg-emerald-800 text-white" },
  },
];
