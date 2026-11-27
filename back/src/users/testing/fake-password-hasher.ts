import { PasswordHasher } from '../application/password-hasher';

export class FakePasswordHasher extends PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  verify({
    hash,
    password,
  }: {
    readonly hash: string;
    readonly password: string;
  }): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}
