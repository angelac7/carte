import { expect, it } from "vitest";
import { authErrorDiagnostic, signupErrorMessage } from "@/lib/auth-errors";
it("distinguishes actionable signup failures without exposing raw provider details", () => {
  expect(signupErrorMessage({ code: "weak_password" })).toContain("stronger password");
  expect(signupErrorMessage({ code: "over_email_send_rate_limit" })).toContain("rate-limited");
  expect(signupErrorMessage({ code: "email_address_not_authorized" })).toContain("email service");
  expect(signupErrorMessage({ code: "signup_disabled" })).toContain("aren't enabled");
  expect(signupErrorMessage({ status: 401 })).toContain("configuration");
  expect(signupErrorMessage({ code: "unexpected_failure" })).toContain("authentication logs");
});
it("logs only a bounded error code and valid HTTP status", () => {
  expect(authErrorDiagnostic({ code: "weak_password", status: 422 })).toEqual({
    code: "weak_password",
    status: 422,
  });
  const malicious = {
    code: "person@example.com secret",
    status: 999,
    email: "private",
    password: "private",
    message: "secret",
  };
  expect(authErrorDiagnostic(malicious)).toEqual({ code: "unknown", status: undefined });
  expect(signupErrorMessage(malicious)).not.toContain("secret");
});

it("gives login failures a clear reason without revealing which emails have accounts", async () => {
  const { loginErrorMessage } = await import("@/lib/auth-errors");
  const mismatch = "That email and password don't match an account.";
  expect(loginErrorMessage({ code: "invalid_credentials", status: 400 })).toBe(mismatch);
  expect(loginErrorMessage({ code: "user_not_found" })).toBe(mismatch);
  expect(loginErrorMessage({ code: "email_not_confirmed" })).toContain("Confirm your email");
  expect(loginErrorMessage({ status: 429 })).toContain("Too many login attempts");
  expect(loginErrorMessage({ status: 401 })).toContain("configuration");
  expect(loginErrorMessage({ status: 0 })).toContain("couldn't reach");
});
