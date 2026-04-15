/**
 * Extension points for bot / abuse protection (Turnstile, hCaptcha, device attestation).
 * Return false to block the action — keep checks server-side only.
 */
export const abuseHooks = {
  /** Called before processing signup (after schema validation). Default: allow. */
  async allowSignupRequest(_ctx: { ip: string; email: string }): Promise<boolean> {
    return true;
  },

  /** Called before login attempt (after schema validation). */
  async allowLoginAttempt(_ctx: { ip: string; email: string }): Promise<boolean> {
    return true;
  },

  /** Called before forgot-password email send. */
  async allowForgotPasswordRequest(_ctx: { ip: string; email: string }): Promise<boolean> {
    return true;
  },
};
