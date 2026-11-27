import { z } from 'zod';

const STORAGE_KEY = 'product-web.session';

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

export function createSession(input: {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly now: number;
}): Session {
  return { accessToken: input.accessToken, expiresAt: input.now + input.expiresInSeconds * 1000 };
}

export function isExpired(session: Session, now: number): boolean {
  return session.expiresAt <= now;
}

export function readStoredSession(now: number): Session | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const parsed = sessionSchema.safeParse(parseJson(raw));
  if (!parsed.success || isExpired(parsed.data, now)) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return parsed.data;
}

export function storeSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
