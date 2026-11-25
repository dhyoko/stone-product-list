/** The JSON body of every error response. */
export interface ErrorBody {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details?: readonly string[];
}
