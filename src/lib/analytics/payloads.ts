/** Allowlisted typed hints for callers — values only, never PII. */

export type LandingCtaPayload = {
  cta: "start_free" | "view_pricing" | "hero_secondary" | "footer_signup" | "other";
  href: string;
};

export type WizardStepPayload = {
  step_id: string;
  step_index: number;
};

export type AiGenerationPayload = {
  operation: string;
};

export type CheckoutPayload = {
  product_sku: string;
};
