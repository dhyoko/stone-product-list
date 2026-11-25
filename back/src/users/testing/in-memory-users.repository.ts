import type { StoredUser } from '../user';
import { UserAlreadyExistsError } from '../user-already-exists.error';
import { UsersRepository } from '../users.repository';

export class InMemoryUsersRepository extends UsersRepository {
  readonly users = new Map<string, StoredUser>();

  findByEmail(email: string): Promise<StoredUser | undefined> {
    return Promise.resolve(this.users.get(email));
  }

  create(user: StoredUser): Promise<void> {
    if (this.users.has(user.email)) {
      return Promise.reject(new UserAlreadyExistsError({ cause: new Error('Email is taken') }));
    }
    this.users.set(user.email, user);
    return Promise.resolve();
  }
}
