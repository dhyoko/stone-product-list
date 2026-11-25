import { z } from 'zod';

export const userIdSchema = z.uuid().brand<'UserId'>();

export type UserId = z.infer<typeof userIdSchema>;

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
}

export interface StoredUser extends User {
  readonly passwordHash: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
