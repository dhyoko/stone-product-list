import { z } from 'zod';
import { requestJson } from './http-client';

const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;

export function logIn(credentials: {
  readonly email: string;
  readonly password: string;
}): Promise<LoginResponse> {
  return requestJson({
    path: '/auth/login',
    method: 'POST',
    body: credentials,
    schema: loginResponseSchema,
  });
}

export function getCurrentUser(input: {
  readonly accessToken: string;
  readonly signal?: AbortSignal;
}): Promise<User> {
  return requestJson({
    path: '/auth/me',
    accessToken: input.accessToken,
    signal: input.signal,
    schema: userSchema,
  });
}
