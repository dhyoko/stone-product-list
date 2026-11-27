export type ApiErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_INVALID_TOKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED_RESPONSE'
  | (string & {});

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: readonly string[];
  readonly retryAfterSeconds: number | undefined;

  constructor(input: {
    readonly status: number;
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly details?: readonly string[];
    readonly retryAfterSeconds?: number;
    readonly cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code;
    this.details = input.details ?? [];
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
