import type { StoredUser, UserId } from './user';

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<StoredUser | undefined>;

  abstract findById(id: UserId): Promise<StoredUser | undefined>;

  abstract create(user: StoredUser): Promise<void>;
}
