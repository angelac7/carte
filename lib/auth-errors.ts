import { en } from "@/lib/i18n/owner/en";

type AuthFailure = { code?: string; status?: number };
type SignupMessages = typeof en.auth.signupErrors;
type LoginMessages = typeof en.auth.loginErrors;

/** Deliberate public messages; never return raw provider errors containing request data. */
export function signupErrorMessage(
  error: AuthFailure,
  messages: SignupMessages = en.auth.signupErrors,
): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return messages.exists;
    case "weak_password":
      return messages.weak;
    case "email_address_invalid":
      return messages.badEmail;
    case "over_email_send_rate_limit":
      return messages.emailRate;
    case "over_request_rate_limit":
      return messages.rateLimit;
    case "email_address_not_authorized":
      return messages.notAuthorized;
    case "signup_disabled":
    case "email_provider_disabled":
      return messages.disabled;
    case "captcha_failed":
      return messages.captcha;
    case "unexpected_failure":
      return messages.unexpected;
  }
  if (error.status === 401 || error.status === 403) return messages.config;
  if (error.status === 429) return messages.rateLimit;
  return messages.generic;
}

/**
 * Deliberate public messages for login. A wrong password and an unknown email get the same
 * message, so the form never reveals which emails have accounts.
 */
export function loginErrorMessage(
  error: AuthFailure,
  messages: LoginMessages = en.auth.loginErrors,
): string {
  switch (error.code) {
    case "invalid_credentials":
    case "user_not_found":
      return messages.credentials;
    case "email_not_confirmed":
      return messages.unconfirmed;
    case "user_banned":
      return messages.banned;
    case "over_request_rate_limit":
      return messages.rateLimit;
  }
  if (error.status === 400) return messages.credentials;
  if (error.status === 429) return messages.rateLimit;
  if (error.status === 401 || error.status === 403) return messages.config;
  return messages.unreachable;
}

/** Only bounded machine codes and HTTP status are logged, never emails, passwords or tokens. */
export function authErrorDiagnostic(error: AuthFailure) {
  return {
    code:
      typeof error.code === "string" && /^[a-z_]{1,64}$/.test(error.code) ? error.code : "unknown",
    status:
      Number.isInteger(error.status) && error.status! >= 100 && error.status! <= 599
        ? error.status
        : undefined,
  };
}
