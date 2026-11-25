import { seedUsers } from './seed-users';
import { FakePasswordHasher } from './testing/fake-password-hasher';
import { InMemoryUsersRepository } from './testing/in-memory-users.repository';
import { userIdSchema } from './user';

describe('seedUsers', () => {
  const hasher = new FakePasswordHasher();
  const users = [
    { email: 'ana@example.com', name: 'Ana', password: 'ana-password' },
    { email: 'bia@example.com', name: 'Bia', password: 'bia-password' },
  ];

  let repository: InMemoryUsersRepository;

  beforeEach(() => {
    repository = new InMemoryUsersRepository();
  });

  it('creates each user with a hashed password and a UUID', async () => {
    const results = await seedUsers({ repository, hasher, users });

    expect(results).toEqual([
      { email: 'ana@example.com', outcome: 'created' },
      { email: 'bia@example.com', outcome: 'created' },
    ]);
    const ana = repository.users.get('ana@example.com');
    expect(ana).toMatchObject({
      email: 'ana@example.com',
      name: 'Ana',
      passwordHash: 'hashed:ana-password',
    });
    expect(userIdSchema.safeParse(ana?.id).success).toBe(true);
  });

  it('skips a user whose email is taken and keeps the stored user', async () => {
    await seedUsers({ repository, hasher, users: users.slice(0, 1) });
    const stored = repository.users.get('ana@example.com');

    const results = await seedUsers({ repository, hasher, users });

    expect(results).toEqual([
      { email: 'ana@example.com', outcome: 'already_exists' },
      { email: 'bia@example.com', outcome: 'created' },
    ]);
    expect(repository.users.get('ana@example.com')).toBe(stored);
  });

  it('rethrows any other error', async () => {
    const error = new Error('Network is unreachable');
    jest.spyOn(repository, 'create').mockRejectedValue(error);

    await expect(seedUsers({ repository, hasher, users })).rejects.toBe(error);
  });
});
