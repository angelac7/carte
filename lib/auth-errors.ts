type AuthFailure = { code?: string; status?: number };

/** Deliberate public messages; never return raw provider errors containing request data. */
export function signupErrorMessage(error: AuthFailure): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Log in instead.";
    case "weak_password":
      return "Choose a stronger password with uppercase and lowercase letters, a number, and a symbol. Avoid common or previously leaked passwords.";
    case "email_address_invalid":
      return "That email address wasn't accepted. Check it and try again.";
    case "over_email_send_rate_limit":
      return "Confirmation emails are temporarily rate-limited. Wait before trying again, or log in if you already have an account.";
    case "over_request_rate_limit":
      return "Too many signup attempts. Wait a few minutes before trying again.";
    case "email_address_not_authorized":
      return "Carte's email service isn't configured to send confirmation to this address yet. Please contact the site owner.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New email accounts aren't enabled right now. Please contact the site owner.";
    case "captcha_failed":
      return "Signup verification failed. Please contact the site owner if this continues.";
    case "unexpected_failure":
      return "The account service couldn't finish signup. Please contact the site owner so they can check the authentication logs.";
  }
  if (error.status === 401 || error.status === 403)
    return "The account service configuration needs attention. Please contact the site owner.";
  if (error.status === 429)
    return "Too many signup attempts. Wait a few minutes before trying again.";
  return "Your account couldn't be created. Please try again. If it continues, contact the site owner.";
}

/**
 * Deliberate public messages for login. A wrong password and an unknown email get the same
 * message, so the form never reveals which emails have accounts.
 */
export function loginErrorMessage(error: AuthFailure): string {
  switch (error.code) {
    case "invalid_credentials":
    case "user_not_found":
      return "That email and password don't match an account.";
    case "email_not_confirmed":
      return "Confirm your email first, using the link we sent you, then log in.";
    case "user_banned":
      return "This account can't log in right now. Please contact the site owner.";
    case "over_request_rate_limit":
      return "Too many login attempts. Wait a few minutes before trying again.";
  }
  if (error.status === 400) return "That email and password don't match an account.";
  if (error.status === 429)
    return "Too many login attempts. Wait a few minutes before trying again.";
  if (error.status === 401 || error.status === 403)
    return "The account service configuration needs attention. Please contact the site owner.";
  return "Carte couldn't reach the account service. Please try again in a moment.";
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
