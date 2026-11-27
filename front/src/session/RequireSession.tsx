import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSession } from './session-context';

export function RequireSession({ children }: { readonly children: ReactNode }): ReactNode {
  const { session } = useSession();
  const location = useLocation();
  if (session === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
