import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCurrentUser, type User } from '../api/auth-api';
import { useAccessToken } from '../session/use-access-token';

export function useCurrentUser(): UseQueryResult<User> {
  const accessToken = useAccessToken();
  return useQuery({
    queryKey: ['current-user'],
    queryFn: ({ signal }) => getCurrentUser({ accessToken, signal }),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
