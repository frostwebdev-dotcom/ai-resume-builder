/**
 * Product analytics event names — stable contracts for warehouse / provider mapping.
 * Payloads must stay privacy-safe (no resume text, names, or raw emails).
 */
export const ANALYTICS_EVENTS = {
  LANDING_CTA_CLICK: "landing_cta_click",
  /** Marketing homepage primary/secondary CTAs (`/`). */
  HOMEPAGE_CTA_CLICKED: "homepage_cta_clicked",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  MAGIC_LINK_REQUESTED: "magic_link_requested",
  /** User opened the guest builder or a signed-in project draft studio. */
  RESUME_ST: "resume_st",
  PROJECT_CREATED: "project_created",
  AI_GENERATION_USED: "ai_generation_used",
  PREVIEW_VIEWED: "preview_viewed",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PDF_DOWNLOADED: "pdf_downloaded",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const ANALYTICS_EVENT_NAMES = Object.values(ANALYTICS_EVENTS) as AnalyticsEventName[];
