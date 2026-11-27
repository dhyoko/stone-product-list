import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { LoginResponse } from '../api/auth-api';
import {
  clearStoredSession,
  createSession,
  readStoredSession,
  type Session,
  storeSession,
} from './session';
import { SessionContext, type SessionContextValue } from './session-context';

export function SessionProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(() => readStoredSession(Date.now()));

  const startSession = useCallback((login: LoginResponse) => {
    const next = createSession({
      accessToken: login.accessToken,
      expiresInSeconds: login.expiresIn,
      now: Date.now(),
    });
    storeSession(next);
    setSession(next);
  }, []);

  const endSession = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  useEffect(() => {
    if (session === null) {
      return undefined;
    }
    const timeout = window.setTimeout(endSession, session.expiresAt - Date.now());
    return () => {
      window.clearTimeout(timeout);
    };
  }, [session, endSession]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, startSession, endSession }),
    [session, startSession, endSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
