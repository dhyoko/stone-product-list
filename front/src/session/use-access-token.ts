import { useSession } from './session-context';

export function useAccessToken(): string {
  const { session } = useSession();
  if (session === null) {
    throw new Error('useAccessToken must be called inside RequireSession');
  }
  return session.accessToken;
}
