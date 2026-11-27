import { QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '../api/api-error';

const MAX_RETRIES = 2;

export function createQueryClient(input: { readonly onUnauthorized: () => void }): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isApiError(error) && error.status === 401) {
          input.onUnauthorized();
          client.clear();
        }
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => isRetryable(error) && failureCount < MAX_RETRIES,
        refetchOnWindowFocus: false,
      },
    },
  });
  return client;
}

function isRetryable(error: unknown): boolean {
  return isApiError(error) && (error.status === 0 || error.status >= 500);
}
