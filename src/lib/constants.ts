/** Application-wide constants (no secrets). */
export const APP_NAME = "Smart Resume Builder";

/** Sentinel `projectId` for the browser-only guest builder — never sent to the server. */
export const GUEST_RESUME_PROJECT_ID = "__guest__" as const;

export const ROUTES = {
  home: "/",
  /** Public resume builder (local draft; sign in to save to your account). */
  create: "/create",
  pricing: "/pricing",
  howItWorks: "/how-it-works",
  templates: "/templates",
  faq: "/faq",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  refundPolicy: "/refund-policy",
  aiDisclaimer: "/ai-disclaimer",
  atsDisclaimer: "/ats-disclaimer",
  styleGuide: "/style-guide",
  app: {
    root: "/app",
    resumes: "/app/resumes",
    /** In-app template browser (workspace). Public catalog: {@link ROUTES.templates}. */
    templates: "/app/templates",
    jobs: "/app/jobs",
    applications: "/app/applications",
    /** @deprecated Use dashboard (`/app`) or a project URL. */
    resume: "/app/resume",
    account: "/app/account",
    project: (id: string) => `/app/projects/${id}`,
    projectBuild: (id: string) => `/app/projects/${id}/build`,
    projectPreview: (id: string) => `/app/projects/${id}/preview`,
    /** Post-Stripe Checkout return (session_id filled by Stripe) */
    projectCheckoutReturn: (id: string) => `/app/projects/${id}/checkout/return`,
  },
  admin: {
    root: "/admin",
    users: "/admin/users",
    projects: "/admin/projects",
    orders: "/admin/orders",
    aiUsage: "/admin/ai-usage",
    downloads: "/admin/downloads",
    audit: "/admin/audit",
    support: "/admin/support",
  },
  auth: {
    login: "/login",
    signup: "/signup",
    forgotPassword: "/forgot-password",
    resetPassword: "/auth/reset-password",
    callback: "/auth/callback",
    /** Session exists but no `profiles` row (e.g. trigger not applied). */
    incomplete: "/auth/incomplete",
  },
} as const;

/**
 * `next` value for login from the guest `/create` flow. After OAuth/magic link, `/auth/callback`
 * redirects here; `/create` imports the guest draft into a new server project and opens Draft
 * (same studio UI with account autosave), or does the same when a session exists and a local guest draft is present.
 */
export const CREATE_RESUME_POST_AUTH_NEXT = `${ROUTES.create}?signedIn=1`;
