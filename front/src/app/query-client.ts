import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '../api/api-error';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => isRetryable(error) && failureCount < MAX_RETRIES,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function isRetryable(error: unknown): boolean {
  return isApiError(error) && (error.status === 0 || error.status >= 500);
}
