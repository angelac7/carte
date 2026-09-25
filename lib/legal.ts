/** When the privacy policy and terms last changed. */
export const LEGAL_UPDATED = "September 25, 2026";

/** The address people write to about privacy or the terms, set in the site's settings. */
export function legalContactEmail(): string | null {
  return process.env.LEGAL_CONTACT_EMAIL?.trim() || null;
}
