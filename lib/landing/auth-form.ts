export interface LoginValues {
  email: string;
  password: string;
}

export interface SignupValues extends LoginValues {
  name: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type AuthFormState =
  | { kind: "idle"; apiError: null }
  | { kind: "invalid"; apiError: null }
  | { kind: "submitting"; apiError: null }
  | { kind: "oauthRedirecting"; apiError: null }
  | { kind: "apiError"; apiError: string }
  | { kind: "redirecting"; apiError: null };

export interface AuthValidationResult<T> {
  values: T;
  fieldErrors: FieldErrors<T>;
  isValid: boolean;
}

export interface AuthFormPolicy {
  isBusy: boolean;
  controlsDisabled: boolean;
  showLoadingIndicator: boolean;
}

export const AUTH_FIELD_ERRORS = {
  nameRequired: "Name is required.",
  emailRequired: "Email is required.",
  emailInvalid: "Please enter a valid email address.",
  passwordRequired: "Password is required.",
  passwordTooShort: "Password must be at least 8 characters.",
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;

export function isValidAuthEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function normalizeLoginValues(values: LoginValues): LoginValues {
  return {
    email: values.email.trim(),
    password: values.password,
  };
}

export function normalizeSignupValues(values: SignupValues): SignupValues {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
  };
}

function projectSharedFieldErrors<T extends LoginValues>(
  values: T,
): FieldErrors<T> {
  const fieldErrors: FieldErrors<T> = {};

  if (values.email.length === 0) {
    fieldErrors.email = AUTH_FIELD_ERRORS.emailRequired;
  } else if (!isValidAuthEmail(values.email)) {
    fieldErrors.email = AUTH_FIELD_ERRORS.emailInvalid;
  }

  if (values.password.length === 0) {
    fieldErrors.password = AUTH_FIELD_ERRORS.passwordRequired;
  } else if (values.password.length < MINIMUM_PASSWORD_LENGTH) {
    fieldErrors.password = AUTH_FIELD_ERRORS.passwordTooShort;
  }

  return fieldErrors;
}

export function projectLoginFieldErrors(
  values: LoginValues,
): FieldErrors<LoginValues> {
  return projectSharedFieldErrors(normalizeLoginValues(values));
}

export function projectSignupFieldErrors(
  values: SignupValues,
): FieldErrors<SignupValues> {
  const normalized = normalizeSignupValues(values);
  const fieldErrors = projectSharedFieldErrors(normalized);

  if (normalized.name.length === 0) {
    fieldErrors.name = AUTH_FIELD_ERRORS.nameRequired;
  }

  return fieldErrors;
}

function validationResult<T>(
  values: T,
  fieldErrors: FieldErrors<T>,
): AuthValidationResult<T> {
  return {
    values,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function validateLogin(
  values: LoginValues,
): AuthValidationResult<LoginValues> {
  const normalized = normalizeLoginValues(values);
  return validationResult(normalized, projectLoginFieldErrors(normalized));
}

export function validateSignup(
  values: SignupValues,
): AuthValidationResult<SignupValues> {
  const normalized = normalizeSignupValues(values);
  return validationResult(normalized, projectSignupFieldErrors(normalized));
}

export function isAuthBusy(state: AuthFormState): boolean {
  return (
    state.kind === "submitting" ||
    state.kind === "oauthRedirecting" ||
    state.kind === "redirecting"
  );
}

export function deriveAuthFormPolicy(state: AuthFormState): AuthFormPolicy {
  const isBusy = isAuthBusy(state);
  return {
    isBusy,
    controlsDisabled: isBusy,
    showLoadingIndicator: isBusy,
  };
}

export function canInvokeAuthentication<T>(
  validation: AuthValidationResult<T>,
  state: AuthFormState,
): boolean {
  return validation.isValid && !isAuthBusy(state);
}
