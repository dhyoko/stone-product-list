import { type ApiError, isApiError } from '../api/api-error';

export interface LoginValues {
  readonly email: string;
  readonly password: string;
}

export interface LoginFieldErrors {
  readonly email?: string;
  readonly password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginValues): LoginFieldErrors {
  const email = values.email.trim();
  return {
    email:
      email === ''
        ? 'Enter your email.'
        : EMAIL_PATTERN.test(email)
          ? undefined
          : 'Enter a valid email, such as name@example.com.',
    password: values.password === '' ? 'Enter your password.' : undefined,
  };
}

export function hasErrors(errors: LoginFieldErrors): boolean {
  return errors.email !== undefined || errors.password !== undefined;
}

export function describeLoginError(error: unknown): string {
  if (!isApiError(error)) {
    return 'Something went wrong. Try again.';
  }
  switch (error.code) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'The email or the password is wrong.';
    case 'RATE_LIMIT_EXCEEDED':
      return `Too many login attempts. Try again in ${formatWait(error)}.`;
    default:
      return error.message;
  }
}

const DEFAULT_RETRY_AFTER_SECONDS = 60;

export function retryWaitSeconds(error: ApiError): number {
  return error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS;
}

function formatWait(error: ApiError): string {
  const seconds = retryWaitSeconds(error);
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}
