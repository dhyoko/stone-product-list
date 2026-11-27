import { isApiError } from './api-error';

export function describeApiError(error: unknown): string {
  if (!isApiError(error)) {
    return 'Something went wrong. Try again.';
  }
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    const seconds = error.retryAfterSeconds;
    return seconds === undefined
      ? 'You sent too many requests. Wait a moment and try again.'
      : `You sent too many requests. Try again in ${seconds === 1 ? '1 second' : `${seconds} seconds`}.`;
  }
  return error.message;
}
