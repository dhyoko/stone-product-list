import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from './password-hasher';
import { userIdSchema } from './user';
import { UserAlreadyExistsError } from './user-already-exists.error';
import type { UsersRepository } from './users.repository';

export interface SeedUser {
  readonly email: string;
  readonly name: string;
  readonly password: string;
}

export type SeedOutcome = 'created' | 'already_exists';

export interface SeedResult {
  readonly email: string;
  readonly outcome: SeedOutcome;
}

export async function seedUsers(input: {
  readonly repository: UsersRepository;
  readonly hasher: PasswordHasher;
  readonly users: readonly SeedUser[];
}): Promise<readonly SeedResult[]> {
  const results: SeedResult[] = [];
  for (const user of input.users) {
    results.push({ email: user.email, outcome: await seedUser({ ...input, user }) });
  }
  return results;
}

async function seedUser({
  repository,
  hasher,
  user,
}: {
  readonly repository: UsersRepository;
  readonly hasher: PasswordHasher;
  readonly user: SeedUser;
}): Promise<SeedOutcome> {
  try {
    await repository.create({
      id: userIdSchema.parse(randomUUID()),
      email: user.email,
      name: user.name,
      passwordHash: await hasher.hash(user.password),
    });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return 'already_exists';
    }
    throw error;
  }
  return 'created';
}
