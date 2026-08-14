import { describe, expect, it } from "vitest";

import {
  AUTH_FIELD_ERRORS,
  canInvokeAuthentication,
  deriveAuthFormPolicy,
  isAuthBusy,
  isValidAuthEmail,
  normalizeLoginValues,
  normalizeSignupValues,
  projectLoginFieldErrors,
  projectSignupFieldErrors,
  validateLogin,
  validateSignup,
  type AuthFormState,
} from "./auth-form";

const idle: AuthFormState = { kind: "idle", apiError: null };

describe("auth value normalization", () => {
  it("normalizes only email for login and preserves password verbatim", () => {
    const values = { email: "  Person@Example.com  ", password: "  secret  " };

    expect(normalizeLoginValues(values)).toEqual({
      email: "Person@Example.com",
      password: "  secret  ",
    });
    expect(values).toEqual({
      email: "  Person@Example.com  ",
      password: "  secret  ",
    });
  });

  it("normalizes name and email for signup without changing password", () => {
    expect(
      normalizeSignupValues({
        name: "  Ada Lovelace  ",
        email: "  ada@example.com ",
        password: " pass word ",
      }),
    ).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: " pass word ",
    });
  });
});

describe("auth field-error projection", () => {
  it("projects exactly the failed login predicates", () => {
    expect(projectLoginFieldErrors({ email: " ", password: "" })).toEqual({
      email: AUTH_FIELD_ERRORS.emailRequired,
      password: AUTH_FIELD_ERRORS.passwordRequired,
    });

    expect(
      projectLoginFieldErrors({ email: "not-an-email", password: "1234567" }),
    ).toEqual({
      email: AUTH_FIELD_ERRORS.emailInvalid,
      password: AUTH_FIELD_ERRORS.passwordTooShort,
    });
  });

  it("projects signup name errors without adding errors for valid fields", () => {
    expect(
      projectSignupFieldErrors({
        name: " \t ",
        email: "valid@example.com",
        password: "12345678",
      }),
    ).toEqual({ name: AUTH_FIELD_ERRORS.nameRequired });
  });

  it("uses the shared email predicate", () => {
    expect(isValidAuthEmail("person@example.com")).toBe(true);
    expect(isValidAuthEmail("person@example")).toBe(false);
  });
});
describe("auth validation", () => {
  it("returns normalized valid login values and no errors", () => {
    expect(
      validateLogin({
        email: "  person@example.com ",
        password: "password",
      }),
    ).toEqual({
      values: { email: "person@example.com", password: "password" },
      fieldErrors: {},
      isValid: true,
    });
  });

  it("accepts an eight-code-unit whitespace password without trimming it", () => {
    const password = "        ";
    const result = validateSignup({
      name: "  Person  ",
      email: " person@example.com ",
      password,
    });

    expect(result).toEqual({
      values: { name: "Person", email: "person@example.com", password },
      fieldErrors: {},
      isValid: true,
    });
  });

  it("returns every and only invalid signup field", () => {
    expect(validateSignup({ name: "", email: "bad", password: "short" })).toEqual({
      values: { name: "", email: "bad", password: "short" },
      fieldErrors: {
        email: AUTH_FIELD_ERRORS.emailInvalid,
        password: AUTH_FIELD_ERRORS.passwordTooShort,
        name: AUTH_FIELD_ERRORS.nameRequired,
      },
      isValid: false,
    });
  });
});

describe("auth form-state policy", () => {
  const states: readonly AuthFormState[] = [
    { kind: "idle", apiError: null },
    { kind: "invalid", apiError: null },
    { kind: "submitting", apiError: null },
    { kind: "oauthRedirecting", apiError: null },
    { kind: "apiError", apiError: "Invalid credentials." },
    { kind: "redirecting", apiError: null },
  ];

  it.each(states)("derives busy controls exactly for $kind", (state) => {
    const expectedBusy = ["submitting", "oauthRedirecting", "redirecting"].includes(
      state.kind,
    );

    expect(isAuthBusy(state)).toBe(expectedBusy);
    expect(deriveAuthFormPolicy(state)).toEqual({
      isBusy: expectedBusy,
      controlsDisabled: expectedBusy,
      showLoadingIndicator: expectedBusy,
    });
  });

  it("guards authentication calls when validation fails or auth is busy", () => {
    const invalid = validateLogin({ email: "invalid", password: "short" });
    const valid = validateLogin({ email: "person@example.com", password: "password" });

    expect(canInvokeAuthentication(invalid, idle)).toBe(false);
    expect(
      canInvokeAuthentication(valid, { kind: "submitting", apiError: null }),
    ).toBe(false);
    expect(canInvokeAuthentication(valid, idle)).toBe(true);
    expect(
      canInvokeAuthentication(valid, {
        kind: "apiError",
        apiError: "Previous attempt failed.",
      }),
    ).toBe(true);
  });
});
