import { expect, it } from "vitest";
import { signupErrorDiagnostic, signupErrorMessage } from "@/lib/auth-errors";
it("distinguishes actionable signup failures without exposing raw provider details", () => {
  expect(signupErrorMessage({ code: "weak_password" })).toContain("stronger password");
  expect(signupErrorMessage({ code: "over_email_send_rate_limit" })).toContain("rate-limited");
  expect(signupErrorMessage({ code: "email_address_not_authorized" })).toContain("email service");
  expect(signupErrorMessage({ code: "signup_disabled" })).toContain("aren't enabled");
  expect(signupErrorMessage({ status: 401 })).toContain("configuration");
  expect(signupErrorMessage({ code: "unexpected_failure" })).toContain("authentication logs");
});
it("logs only a bounded error code and valid HTTP status", () => {
  expect(signupErrorDiagnostic({ code: "weak_password", status: 422 })).toEqual({
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
  expect(signupErrorDiagnostic(malicious)).toEqual({ code: "unknown", status: undefined });
  expect(signupErrorMessage(malicious)).not.toContain("secret");
});
