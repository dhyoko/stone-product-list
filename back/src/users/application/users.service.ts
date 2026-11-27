import { Injectable } from '@nestjs/common';
import { PasswordHasher } from './password-hasher';
import { normalizeEmail, type StoredUser, type User, type UserId } from '../domain/user';
import { UsersRepository } from './users.repository';

const DUMMY_PASSWORD = 'dummy-password-for-unknown-emails';

@Injectable()
export class UsersService {
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly repository: UsersRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async verifyCredentials(input: {
    readonly email: string;
    readonly password: string;
  }): Promise<User | undefined> {
    const stored = await this.repository.findByEmail(normalizeEmail(input.email));
    if (stored === undefined) {
      await this.spendHashTimeToHideUnknownEmail(input.password);
      return undefined;
    }
    const isMatch = await this.hasher.verify({
      hash: stored.passwordHash,
      password: input.password,
    });
    return isMatch ? toUser(stored) : undefined;
  }

  async findById(id: UserId): Promise<User | undefined> {
    const stored = await this.repository.findById(id);
    return stored === undefined ? undefined : toUser(stored);
  }

  private async spendHashTimeToHideUnknownEmail(password: string): Promise<void> {
    this.dummyHash ??= this.hasher.hash(DUMMY_PASSWORD);
    await this.hasher.verify({ hash: await this.dummyHash, password });
  }
}

function toUser({ id, email, name }: StoredUser): User {
  return { id, email, name };
}
