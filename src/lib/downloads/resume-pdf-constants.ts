/**
 * Signed download URL lifetime (seconds). Used by the PDF pipeline and UI copy.
 * Not a permanent public URL — object remains private in storage.
 */
export const RESUME_PDF_SIGNED_URL_TTL_SEC = 300;

export const RESUME_PDF_SIGNED_URL_TTL_MINUTES = RESUME_PDF_SIGNED_URL_TTL_SEC / 60;
