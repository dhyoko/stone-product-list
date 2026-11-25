import { Test } from '@nestjs/testing';
import { PasswordHasher } from './password-hasher';
import { FakePasswordHasher } from './testing/fake-password-hasher';
import { InMemoryUsersRepository } from './testing/in-memory-users.repository';
import { type StoredUser, userIdSchema } from './user';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const ana: StoredUser = {
  id: userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f'),
  email: 'ana@example.com',
  name: 'Ana',
  passwordHash: 'hashed:ana-password',
};

describe('UsersService', () => {
  let service: UsersService;
  let hasher: FakePasswordHasher;

  beforeEach(async () => {
    const repository = new InMemoryUsersRepository();
    repository.users.set(ana.email, ana);
    hasher = new FakePasswordHasher();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: PasswordHasher, useValue: hasher },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('verifyCredentials', () => {
    it('returns the user without the password hash when the password matches', async () => {
      await expect(
        service.verifyCredentials({ email: 'ana@example.com', password: 'ana-password' }),
      ).resolves.toEqual({ id: ana.id, email: 'ana@example.com', name: 'Ana' });
    });

    it('matches the email without regard to case or surrounding spaces', async () => {
      await expect(
        service.verifyCredentials({ email: '  Ana@Example.COM ', password: 'ana-password' }),
      ).resolves.toMatchObject({ id: ana.id });
    });

    it('returns undefined when the password is wrong', async () => {
      await expect(
        service.verifyCredentials({ email: 'ana@example.com', password: 'wrong' }),
      ).resolves.toBeUndefined();
    });

    it('verifies a dummy hash when the email is unknown', async () => {
      const verify = jest.spyOn(hasher, 'verify');

      await expect(
        service.verifyCredentials({ email: 'nobody@example.com', password: 'guess' }),
      ).resolves.toBeUndefined();
      expect(verify).toHaveBeenCalledWith({
        hash: 'hashed:dummy-password-for-unknown-emails',
        password: 'guess',
      });
    });

    it('hashes the dummy password only once', async () => {
      const hash = jest.spyOn(hasher, 'hash');

      await service.verifyCredentials({ email: 'nobody@example.com', password: 'one' });
      await service.verifyCredentials({ email: 'nobody@example.com', password: 'two' });

      expect(hash).toHaveBeenCalledTimes(1);
    });
  });
});
