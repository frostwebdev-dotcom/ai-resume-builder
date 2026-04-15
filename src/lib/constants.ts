/** Application-wide constants (no secrets). */
export const APP_NAME = "AI Resume Builder";

export const ROUTES = {
  home: "/",
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
  },
} as const;
