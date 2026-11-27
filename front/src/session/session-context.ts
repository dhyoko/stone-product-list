import { createContext, useContext } from 'react';
import type { LoginResponse } from '../api/auth-api';
import type { Session } from './session';

export interface SessionContextValue {
  readonly session: Session | null;
  readonly startSession: (login: LoginResponse) => void;
  readonly endSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession must be called inside a SessionProvider');
  }
  return value;
}
