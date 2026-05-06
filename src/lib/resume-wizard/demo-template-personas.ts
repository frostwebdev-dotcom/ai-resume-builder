import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { TEMPLATE_SLUG_ORDER } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, templateSupportsAvatar } from "@/lib/resume-preview/template-theme";
import { DEFAULT_GUEST_STUDIO_SECTION_ORDER } from "@/lib/resume-wizard/section-order";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

/** Stable portrait URLs (Unsplash) for sidebar / photo-banner previews only. */
const DEMO_PORTRAIT_URLS: readonly string[] = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741776-53994a69da7e?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-15067947782032-cd86730ce671?auto=format&w=512&h=512&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&w=512&h=512&fit=crop&q=80",
];

/** Slugs that render an avatar slot (must match `template-theme` layout sets). */
const PHOTO_SLUGS_ORDERED: readonly TemplateSlug[] = [
  "astra",
  "borealis",
  "denali",
  "ember",
  "iris",
  "matrix",
  "nimbus",
  "pacific",
  "quartz",
  "titan",
  "vertex",
  "willow",
];

export function getDemoAvatarUrlForTemplate(slug: TemplateSlug): string | null {
  if (!templateSupportsAvatar(getTemplateTheme(slug))) return null;
  const i = PHOTO_SLUGS_ORDERED.indexOf(slug);
  if (i < 0) return null;
  return DEMO_PORTRAIT_URLS[i % DEMO_PORTRAIT_URLS.length] ?? null;
}

function entryUuid(slug: TemplateSlug, slot: number): string {
  const idx = TEMPLATE_SLUG_ORDER.indexOf(slug);
  const id = (idx + 1) * 100 + slot;
  const hex = id.toString(16).padStart(12, "0");
  return `f0000001-0000-4000-8000-${hex}`;
}

function rot<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

function rot2<T>(arr: readonly T[], i: number, salt: number): T {
  return arr[(i * salt + 7) % arr.length]!;
}

const GIVEN = [
  "Jordan",
  "Priya",
  "Marcus",
  "Elena",
  "Samir",
  "Claire",
  "Diego",
  "Amara",
  "Theo",
  "Lin",
  "Noah",
  "Sofia",
  "Kwame",
  "Mira",
  "Henrik",
  "Yuki",
  "Omar",
  "Ines",
  "Viktor",
  "Aisha",
  "Luca",
  "Nadia",
  "Ethan",
  "Rosa",
  "Kai",
  "Fatima",
  "Ivan",
  "Zara",
  "Ben",
  "Hana",
  "Mateo",
  "Leila",
  "Jonas",
  "Mei",
  "Alex",
  "Camille",
  "Raj",
  "Tessa",
  "Felix",
  "Nina",
] as const;

const FAMILY = [
  "Nguyen",
  "Patel",
  "Okafor",
  "Vasquez",
  "Haddad",
  "Dubois",
  "Silva",
  "Okonkwo",
  "Berg",
  "Chen",
  "Fischer",
  "Alvarez",
  "Nakamura",
  "Kowalski",
  "Lindström",
  "Tanaka",
  "Rahman",
  "Costa",
  "Popov",
  "Mahmoud",
  "Romano",
  "El-Amin",
  "Park",
  "García",
  "Yamamoto",
  "Hussein",
  "Novak",
  "Benali",
  "Schmidt",
  "Watanabe",
  "Ortega",
  "Farouk",
  "Andersen",
  "Zhou",
  "Rivera",
  "Moreau",
  "Kapoor",
  "Olsen",
  "Weber",
  "Sato",
] as const;

const STREETS = [
  "14 Cedar Lane",
  "88 Harbour View",
  "3 Ringstraße",
  "1200 Lakeshore Blvd",
  "9 Via Roma",
  "45 Queen Street",
  "221 Baker Road",
  "7 Rue Lafayette",
  "502 Market Plaza",
  "18 Strandvägen",
] as const;

const CITIES = [
  "Toronto, ON",
  "Austin, TX",
  "Berlin",
  "Singapore",
  "Madrid",
  "Dublin",
  "Seattle, WA",
  "Lyon",
  "Chicago, IL",
  "Stockholm",
  "Boston, MA",
  "Milan",
  "Denver, CO",
  "Brussels",
  "Portland, OR",
  "Osaka",
  "Atlanta, GA",
  "Barcelona",
  "Vancouver, BC",
  "Zurich",
] as const;

const POST = [
  "M5V 2T6",
  "78701",
  "10115",
  "018956",
  "28013",
  "D02 XY45",
  "98101",
  "69002",
  "60607",
  "111 22",
  "02108",
  "20121",
  "80202",
  "1000",
  "97205",
  "530-0001",
  "30309",
  "08013",
  "V6B 1A1",
  "8001",
] as const;

const LOC_LINE = [
  "Toronto · Hybrid",
  "Austin · Remote",
  "Berlin · Onsite",
  "Singapore · Hybrid",
  "Madrid · Remote",
  "Dublin · Hybrid",
  "Seattle · Remote",
  "Lyon · Onsite",
  "Chicago · Hybrid",
  "Stockholm · Remote",
  "Boston · Hybrid",
  "Milan · Onsite",
  "Denver · Remote",
  "Brussels · Hybrid",
  "Portland · Remote",
  "Osaka · Onsite",
  "Atlanta · Hybrid",
  "Barcelona · Remote",
  "Vancouver · Hybrid",
  "Zurich · Onsite",
] as const;

const DOB = [
  "12 June 1991",
  "03 February 1988",
  "21 November 1994",
  "09 April 1986",
  "30 July 1992",
  "18 January 1989",
  "05 October 1996",
  "27 March 1987",
  "14 December 1993",
  "01 May 1990",
  "22 August 1985",
  "16 September 1997",
  "08 July 1991",
  "25 February 1984",
  "11 June 1995",
  "19 October 1988",
  "04 April 1992",
  "29 November 1987",
  "13 January 1994",
  "07 March 1983",
] as const;

const POB = [
  "Calgary, Canada",
  "Houston, USA",
  "Leipzig, Germany",
  "Penang, Malaysia",
  "Valencia, Spain",
  "Cork, Ireland",
  "Spokane, USA",
  "Grenoble, France",
  "Milwaukee, USA",
  "Gothenburg, Sweden",
  "Providence, USA",
  "Turin, Italy",
  "Boulder, USA",
  "Ghent, Belgium",
  "Salem, USA",
  "Kyoto, Japan",
  "Savannah, USA",
  "Tarragona, Spain",
  "Victoria, Canada",
  "Basel, Switzerland",
] as const;

const NATIONALITY = [
  "Canadian",
  "United States",
  "German",
  "Singaporean",
  "Spanish",
  "Irish",
  "United States",
  "French",
  "United States",
  "Swedish",
  "United States",
  "Italian",
  "United States",
  "Belgian",
  "United States",
  "Japanese",
  "United States",
  "Spanish",
  "Canadian",
  "Swiss",
] as const;

const GENDER = ["Female", "Male", "Male", "Female", "Male", "Female", "Non-binary", "", "Male", "Female"] as const;

const CIVIL = ["Single", "Married", "Single", "Domestic partnership", "Single", "Married", "Single", "Single", "Married", "Single"] as const;

const LICENSE = [
  "Class G, expires 2029",
  "Class C, expires 2028",
  "EU Class B",
  "",
  "Class D, expires 2027",
  "",
  "Class C, expires 2030",
  "",
  "Class B, expires 2026",
  "",
] as const;

const JOB_TITLES = [
  "Senior software engineer",
  "Product marketing manager",
  "Clinical research associate",
  "Financial analyst",
  "Mechanical design engineer",
  "UX researcher",
  "DevOps engineer",
  "Corporate counsel",
  "Data scientist",
  "Operations manager",
  "Brand strategist",
  "Civil engineer",
  "IT security analyst",
  "HR business partner",
  "Sales engineer",
  "Nurse practitioner",
  "Full-stack developer",
  "Supply chain analyst",
  "Content designer",
  "Project manager",
] as const;

const HEADLINE_SUFFIX = [
  "— cloud platforms · TypeScript",
  "— GTM · positioning · launches",
  "— trials · regulatory documentation",
  "— FP&A · forecasting · board decks",
  "— CAD · prototyping · manufacturing",
  "— mixed methods · accessibility",
  "— Kubernetes · CI/CD · SRE",
  "— contracts · vendor risk",
  "— ML pipelines · experimentation",
  "— lean · continuous improvement",
  "— campaigns · creative direction",
  "— infrastructure · environmental review",
  "— SOC2 · IAM · audits",
  "— talent programs · ERGs",
  "— enterprise SaaS · demos",
  "— primary care · population health",
  "— React · Node · Postgres",
  "— planning · 3PL partnerships",
  "— design systems · content strategy",
  "— agile delivery · stakeholder alignment",
] as const;

const SUMMARIES = [
  "Engineering lead with a track record of shipping reliable services under tight SLAs. Partners with product on discovery, owns technical design reviews, and mentors junior engineers through structured pairing.",
  "Marketing operator who connects narrative, analytics, and sales enablement. Comfortable owning launches end-to-end—from messaging hierarchy to webinar scripts and pipeline reporting.",
  "Detail-oriented clinical coordinator experienced in site communication, source data review, and ethics submissions. Thrives in regulated environments where accuracy and tact matter.",
  "Analyst who builds transparent models finance teams actually use. Strong Excel and BI fundamentals; comfortable presenting variance stories to leadership and iterating after feedback.",
  "Mechanical engineer focused on design for manufacture, tolerance stacks, and supplier collaboration. Hands-on with prototypes and test fixtures; clear documentation habits.",
  "Researcher who blends qualitative depth with survey instrumentation. Facilitates usability sessions, synthesizes findings quickly, and works with design to prioritize fixes.",
  "Platform engineer motivated by developer experience and incident learning. Automates repetitive work, documents runbooks, and participates in on-call with a calm, methodical style.",
  "Pragmatic attorney supporting commercial teams on MSAs, DPAs, and procurement. Translates legal risk into plain language so deals move without sacrificing compliance posture.",
  "Applied scientist with strengths in causal thinking and clean experiment design. Collaborates with stakeholders to define metrics, validate assumptions, and communicate uncertainty honestly.",
  "Operations lead who stabilizes processes before scaling them. Comfortable on the warehouse floor, in the spreadsheet, and in the leadership meeting—often in the same week.",
  "Creative strategist with editorial instincts and channel fluency. Builds cohesive brand systems and adapts tone for B2B audiences without losing personality.",
  "Licensed engineer experienced in public-sector submissions, drainage design, and multidisciplinary coordination. Communicates clearly with contractors and municipal reviewers.",
  "Security practitioner who prefers prevention over heroics. Implements least-privilege patterns, improves logging, and coaches teams on secure defaults.",
  "People partner trusted for tough conversations and fair process. Designs lightweight policies, supports managers through change, and keeps employee experience measurable.",
  "Technical seller who can whiteboard architecture and follow up with crisp ROI. Builds mutual trust with buyers and hands off clean notes to customer success.",
  "Clinician-educator focused on preventive care and clear patient communication. Documents thoroughly and collaborates across specialties for coordinated treatment plans.",
  "Builder who enjoys full-stack product work and pragmatic testing. Cares about performance budgets, accessible components, and incremental delivery.",
  "Analyst linking demand signals to inventory decisions. Comfortable with ERP extracts, scenario planning, and cross-functional prioritization when capacity is constrained.",
  "Designer-writer hybrid who makes complex flows legible. Partners with legal and support to keep in-product language accurate, humane, and on-brand.",
  "Delivery-focused PM who keeps risk visible and decisions documented. Facilitates trade-offs between scope, time, and quality without losing stakeholder alignment.",
] as const;

const COMPANIES_A = [
  "Northline Systems",
  "Brightwave Analytics",
  "Harbor Health Labs",
  "Sterling Capital",
  "Forge Robotics",
  "Signal UX Studio",
  "Cobalt Cloud",
  "Meridian Legal LLP",
  "Lattice Data Co.",
  "BlueRiver Logistics",
  "Northwind Media",
  "Summit Civil",
  "Ironwatch Security",
  "PeopleFirst HR",
  "Vertex Industrial",
  "Riverside Care Group",
  "Polaris Apps",
  "Continental Supply",
  "Draft & Co.",
  "Keystone Delivery",
] as const;

const COMPANIES_B = [
  "Aurora Payments",
  "Greenfield Bio",
  "Metro General Hospital",
  "Crescent Advisors",
  "Titan Motors",
  "Loop Research",
  "StackFrame Inc.",
  "Blackwood Compliance",
  "NovaMetrics",
  "Pacific Rail Partners",
  "Urban Stories Agency",
  "Granite City Works",
  "ShieldPoint",
  "TalentBridge",
  "Helios Manufacturing",
  "Willow Clinic",
  "BrightCode Labs",
  "Atlas Freight",
  "Paper Crane Studio",
  "Silverline PMO",
] as const;

const HIGH_A = [
  [
    "Led a cross-squad migration to a modular service boundary; cut incident blast radius and improved deploy frequency.",
    "Introduced SLO dashboards and error-budget policy; leadership adopted it for quarterly planning.",
    "Mentored four engineers through promotion; built internal RFC templates still in use.",
  ],
  [
    "Owned narrative and pricing for a mid-market SKU; contributed to ARR growth in two consecutive quarters.",
    "Built competitive battlecards and sales training; shortened enterprise sales cycle measurably.",
    "Partnered with demand gen on webinar series that fed qualified pipeline.",
  ],
  [
    "Monitored study visits for protocol deviations; maintained audit-ready binders across three sites.",
    "Drafted patient-facing materials reviewed by IRB with minimal revision cycles.",
    "Coordinated investigator meetings and accurate minutes under tight timelines.",
  ],
] as const;

const HIGH_B = [
  [
    "Built forecasting models used in board materials; improved forecast accuracy versus prior baseline.",
    "Automated recurring variance commentary; freed finance team for strategic projects.",
    "Partnered with IT on data lineage documentation for SOX controls.",
  ],
  [
    "Shipped two hardware revisions on schedule; coordinated DFM feedback from overseas vendors.",
    "Reduced part count in a subassembly; lowered BOM cost without sacrificing reliability.",
    "Authored test plans and supported reliability testing through certification.",
  ],
  [
    "Ran usability studies for a flagship workflow; findings drove a prioritized redesign backlog.",
    "Established research repository and tagging so insights stay discoverable.",
    "Collaborated with design on accessible patterns for forms and tables.",
  ],
] as const;

const SCHOOLS = [
  "University of Waterloo",
  "UT Austin",
  "TU Berlin",
  "NUS",
  "IE University",
  "Trinity College Dublin",
  "UW Seattle",
  "ENS Lyon",
  "Northwestern University",
  "KTH Royal Institute",
] as const;

const DEGREES = [
  "BASc, Computer Engineering",
  "BBA, Marketing",
  "BS, Biology",
  "BComm, Finance",
  "BS, Mechanical Engineering",
  "BA, Psychology",
  "BS, Information Systems",
  "MS, Human-Computer Interaction",
  "BS, Economics",
  "MSc, Structural Engineering",
] as const;

const FIELDS = [
  "Software systems",
  "Business administration",
  "Life sciences",
  "Corporate finance",
  "Product design",
  "Cognitive science",
  "Cybersecurity policy",
  "Interaction design",
  "Econometrics",
  "Civil structures",
] as const;

const CERT_NAMES = [
  "AWS Solutions Architect – Associate",
  "HubSpot Content Marketing",
  "GCP Professional Cloud DevOps",
  "CFA Level II",
  "FE Exam – Passed",
  "Certified ScrumMaster (CSM)",
  "CompTIA Security+",
  "SHRM-CP",
  "PMP",
  "RN, BSN",
] as const;

const CERT_ISSUERS = [
  "Amazon Web Services",
  "HubSpot Academy",
  "Google Cloud",
  "CFA Institute",
  "NCEES",
  "Scrum Alliance",
  "CompTIA",
  "SHRM",
  "PMI",
  "State Board of Nursing",
] as const;

const PROJECT_NAMES = [
  "Telemetry hardening kit",
  "Launch narrative playbook",
  "Trial-site onboarding portal",
  "Board KPI cockpit",
  "Supplier scorecard tool",
  "Research ops handbook",
  "GitOps templates",
  "Contract clause library",
  "Experiment registry",
  "Warehouse slotting model",
] as const;

/**
 * Rich, **template-specific** fictional demo content for catalog previews and seeded projects.
 * Names, roles, skills, personal fields, and highlights vary by template index; avatars use
 * `getDemoAvatarUrlForTemplate` at map-to-preview time for photo-capable layouts.
 */
export function buildDemoWizardStateForTemplateSlug(slug: TemplateSlug): WizardStateV1 {
  const i = TEMPLATE_SLUG_ORDER.indexOf(slug);
  if (i < 0) {
    throw new Error(`Unknown template slug: ${slug}`);
  }

  const given = rot(GIVEN, i);
  const family = rot2(FAMILY, i, 17);
  const fullName = `${given} ${family}`;
  const city = rot(CITIES, i);
  const street = rot(STREETS, i);
  const post = rot(POST, i);
  const loc = rot(LOC_LINE, i);
  const job = rot(JOB_TITLES, i);
  const headline = `${job} ${rot(HEADLINE_SUFFIX, i)}`;
  const emailLocal = `${given.toLowerCase()}.${family.toLowerCase()}.d${i + 1}`.replace(/[^a-z0-9.]/g, "");
  const liHandle = `in/demo-${(i + 100).toString(36)}-candidate`;

  const expHighA = [...rot(HIGH_A, i)];
  const expHighB = [...rot(HIGH_B, i + 3)];

  return {
    v: 1,
    personal: {
      fullName,
      givenName: given,
      middleName: "",
      familyName: family,
      photoDataUrl: "",
      desiredJobPosition: job,
      useJobPositionAsHeadline: true,
      email: `${emailLocal}@example.com`,
      phone: rot(
        ["+1 416 555 0102", "+1 512 555 0134", "+49 30 5551 8920", "+65 6123 4410", "+34 91 555 7711"],
        i,
      ),
      address: street,
      postCode: post,
      city,
      location: loc,
      linkedIn: `linkedin.com/${liHandle}`,
      website: `https://portfolio.example.com/${slug}-demo`,
      dateOfBirth: rot(DOB, i),
      placeOfBirth: rot(POB, i),
      driversLicense: rot(LICENSE, i),
      gender: rot(GENDER, i),
      nationality: rot(NATIONALITY, i),
      civilStatus: rot(CIVIL, i),
      customFields:
        i % 4 === 0
          ? [
              {
                id: entryUuid(slug, 99),
                label: "Work authorization",
                value: "Authorized to work in listed regions",
              },
            ]
          : [],
      showNameIn: "title",
    },
    summary: {
      headline,
      summary: rot(SUMMARIES, i),
    },
    experience: {
      entries: [
        {
          id: entryUuid(slug, 1),
          company: rot(COMPANIES_A, i),
          title: job,
          location: rot(["Remote · Americas", "Hybrid · EU", "Onsite", "Remote · Global"], i),
          startDate: "Jan 2021",
          endDate: "",
          current: true,
          highlights: expHighA,
        },
        {
          id: entryUuid(slug, 2),
          company: rot(COMPANIES_B, i + 1),
          title: rot(
            [
              "Senior contributor",
              "Team lead",
              "Consultant",
              "Specialist",
              "Engineer II",
              "Analyst",
              "Coordinator",
            ],
            i,
          ),
          location: city,
          startDate: "Mar 2018",
          endDate: "Dec 2020",
          current: false,
          highlights: expHighB,
        },
      ],
    },
    education: {
      entries: [
        {
          id: entryUuid(slug, 3),
          school: rot(SCHOOLS, i),
          degree: rot(DEGREES, i),
          field: rot(FIELDS, i),
          startDate: "2012",
          endDate: "2016",
          current: false,
          details: rot(
            [
              "Capstone: cross-functional product with measurable usability outcomes.",
              "Thesis: applied statistics project with industry dataset.",
              "Honors program; peer tutor for two semesters.",
            ],
            i,
          ),
        },
      ],
    },
    skills: {
      lines: [
        rot(
          [
            "TypeScript · React · Node · PostgreSQL · Docker · AWS basics",
            "Positioning · storytelling · Marketo · Salesforce · SQL for marketing",
            "GCP · Terraform · Kubernetes · Prometheus · GitHub Actions",
            "Excel · Power BI · SQL · financial modeling · board reporting",
            "SolidWorks · GD&T · FEA basics · vendor management",
            "Figma · Maze · Dovetail · workshop facilitation · survey design",
          ],
          i,
        ),
        rot(
          [
            "Stakeholder communication · documentation · mentoring",
            "Campaign analytics · A/B testing · stakeholder workshops",
            "Incident response · IAM · least privilege · audit evidence",
            "Contract review · third-party risk · privacy addenda",
            "Experiment design · Python · dbt · Looker",
          ],
          i + 2,
        ),
      ].join("\n"),
    },
    languages: {
      lines: rot(
        [
          "English — native\nFrench — professional working proficiency",
          "English — native\nSpanish — conversational",
          "German — native\nEnglish — fluent",
          "English — native\nMandarin — professional working proficiency",
          "English — native\nArabic — professional working proficiency",
        ],
        i,
      ),
    },
    hobbies: {
      lines: rot(
        [
          "Cycling · community orchestra",
          "Trail running · film photography",
          "Chess · sourdough baking",
          "Open-water swimming · sci-fi book club",
          "",
        ],
        i,
      ),
    },
    courses: { lines: "" },
    internships: { lines: "" },
    certifications: {
      entries: [
        {
          id: entryUuid(slug, 4),
          name: rot(CERT_NAMES, i),
          issuer: rot(CERT_ISSUERS, i),
          issued: rot(["2019", "2020", "2021", "2022"], i),
          expires: i % 3 === 0 ? "" : "2026",
        },
      ],
    },
    projects: {
      entries: [
        {
          id: entryUuid(slug, 5),
          name: rot(PROJECT_NAMES, i),
          url: `https://github.com/example/${slug}-demo`,
          description: rot(
            [
              "Open toolkit for internal teams; documented APIs and usage patterns.",
              "Lightweight dashboard used by leadership for weekly operating reviews.",
              "Volunteer project supporting a local nonprofit with pro-bono analytics.",
            ],
            i,
          ),
          technologies: rot(
            [
              "TypeScript · React · Vite",
              "Python · Streamlit",
              "Next.js · Supabase",
              "R · Quarto",
            ],
            i,
          ),
        },
      ],
    },
    additional: {
      notes: rot(
        [
          "References available on request.\nVolunteer mentor, regional professional association (2022–present).",
          "Willing to relocate for the right role.\nPortfolio samples available under NDA.",
          "Conference speaker: internal enablement track (2023, 2024).",
        ],
        i,
      ),
    },
    layout: {
      v: 1,
      pageBreakBefore: {},
      sectionOrder: [...DEFAULT_GUEST_STUDIO_SECTION_ORDER],
    },
  };
}
