export type ErrorCategory =
  'invalid_input' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'rate_limited';

export interface DomainErrorOptions {
  /** The original error. It is logged and never sent to the client. */
  readonly cause?: unknown;
  /** Extra messages for the client, such as one line per invalid field. */
  readonly details?: readonly string[];
}

/**
 * Base class for errors that services throw. Each subclass sets a stable `code`
 * that clients can branch on, and a `category` that decides the HTTP status.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  readonly details: readonly string[] | undefined;

  constructor(message: string, options: DomainErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.details = options.details;
  }
}
