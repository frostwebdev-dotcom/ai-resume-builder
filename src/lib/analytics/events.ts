/**
 * Product analytics event names — stable contracts for warehouse / provider mapping.
 * Payloads must stay privacy-safe (no resume text, names, or raw emails).
 */
export const ANALYTICS_EVENTS = {
  LANDING_CTA_CLICK: "landing_cta_click",
  /** Marketing homepage primary/secondary CTAs (`/`). */
  HOMEPAGE_CTA_CLICKED: "homepage_cta_clicked",
  HOMEPAGE_PRIMARY_CTA_CLICKED: "homepage_primary_cta_clicked",
  HOMEPAGE_TEMPLATES_CLICKED: "homepage_templates_clicked",
  HOMEPAGE_PREVIEW_VIEWED: "homepage_preview_viewed",
  HOMEPAGE_AI_EXAMPLE_VIEWED: "homepage_ai_example_viewed",
  RESUME_STARTED_FROM_HOMEPAGE: "resume_started_from_homepage",
  GUEST_CREATE_PAGE_VIEWED: "guest_create_page_viewed",
  START_FROM_SCRATCH_CLICKED: "start_from_scratch_clicked",
  START_FROM_EXAMPLE_CLICKED: "start_from_example_clicked",
  UPLOAD_RESUME_CLICKED: "upload_resume_clicked",
  LINKEDIN_IMPORT_CLICKED: "linkedIn_import_clicked",
  GUEST_DRAFT_CREATED: "guest_draft_created",
  SAVE_TO_ACCOUNT_PROMPT_VIEWED: "save_to_account_prompt_viewed",
  SAVE_TO_ACCOUNT_CLICKED: "save_to_account_clicked",
  PREVIEW_RESUME_CLICKED: "preview_resume_clicked",
  MOBILE_PREVIEW_CLICKED: "mobile_preview_clicked",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  MAGIC_LINK_REQUESTED: "magic_link_requested",
  /** User opened the guest builder or a signed-in project draft studio. */
  RESUME_ST: "resume_st",
  PROJECT_CREATED: "project_created",
  AI_GENERATION_USED: "ai_generation_used",
  PREVIEW_VIEWED: "preview_viewed",
  PAY_ONCE_DOWNLOAD_CLICKED: "pay_once_download_clicked",
  DOWNLOAD_MODAL_OPENED: "download_modal_opened",
  DOWNLOAD_FORMAT_SELECTED: "download_format_selected",
  EXPORT_VALIDATION_FAILED: "export_validation_failed",
  EXPORT_VALIDATION_WARNING_SHOWN: "export_validation_warning_shown",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_UNAVAILABLE: "checkout_unavailable",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_SUCCESS_PAGE_VIEWED: "payment_success_page_viewed",
  PAYMENT_VERIFICATION_STARTED: "payment_verification_started",
  PAYMENT_VERIFIED: "payment_verified",
  PAYMENT_VERIFICATION_DELAYED: "payment_verification_delayed",
  PAYMENT_CANCELLED_PAGE_VIEWED: "payment_cancelled_page_viewed",
  PDF_PREPARE_STARTED: "pdf_prepare_started",
  PDF_DOWNLOAD_CLICKED: "pdf_download_clicked",
  PAID_PDF_DOWNLOAD_CLICKED: "paid_pdf_download_clicked",
  PDF_DOWNLOAD_STARTED: "pdf_download_started",
  PDF_DOWNLOAD_COMPLETED: "pdf_download_completed",
  PAID_PDF_DOWNLOAD_COMPLETED: "paid_pdf_download_completed",
  PAID_PDF_DOWNLOAD_STARTED: "paid_pdf_download_started",
  PDF_DOWNLOADED: "pdf_downloaded",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const ANALYTICS_EVENT_NAMES = Object.values(ANALYTICS_EVENTS) as AnalyticsEventName[];
