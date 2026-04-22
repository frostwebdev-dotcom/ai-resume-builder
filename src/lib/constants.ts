/** Application-wide constants (no secrets). */
export const APP_NAME = "AI Resume Builder";

/** Sidebar / dashboard wordmark (matches product dashboard chrome). */
export const APP_DASHBOARD_WORDMARK = "CV Wizard";

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
  styleGuide: "/style-guide",
  app: {
    root: "/app",
    resumes: "/app/resumes",
    coverLetters: "/app/cover-letters",
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
 * redirects here; `/create` reads `signedIn=1` client-side and shows a short banner (draft stays
 * localStorage until the user creates a project, then opens Draft—the same studio UI—on that project).
 */
export const CREATE_RESUME_POST_AUTH_NEXT = `${ROUTES.create}?signedIn=1`;
