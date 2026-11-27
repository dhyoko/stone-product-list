import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppConfig } from '../config/app-config';
import { buildTestConfig } from '../config/testing/test-config';
import { PasswordHasher } from '../users/application/password-hasher';
import { FakePasswordHasher } from '../users/testing/fake-password-hasher';
import { InMemoryUsersRepository } from '../users/testing/in-memory-users.repository';
import { userIdSchema } from '../users/domain/user';
import { UsersRepository } from '../users/application/users.repository';
import { UsersService } from '../users/application/users.service';
import { AuthService } from './auth.service';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { InvalidTokenError } from './invalid-token.error';
import { createJwtOptions } from './jwt-options';
import { TokenService } from './token.service';

const ANA_ID = userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f');

describe('AuthService', () => {
  const config = buildTestConfig();

  let service: AuthService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const repository = new InMemoryUsersRepository();
    repository.users.set('ana@example.com', {
      id: ANA_ID,
      email: 'ana@example.com',
      name: 'Ana',
      passwordHash: 'hashed:ana-password',
    });
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register(createJwtOptions(config))],
      providers: [
        AuthService,
        UsersService,
        TokenService,
        { provide: AppConfig, useValue: config },
        { provide: UsersRepository, useValue: repository },
        { provide: PasswordHasher, useValue: new FakePasswordHasher() },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
  });

  describe('login', () => {
    it('returns an access token for the user when the credentials match', async () => {
      const token = await service.login({ email: 'ana@example.com', password: 'ana-password' });

      expect(token.expiresInSeconds).toBe(900);
      await expect(tokenService.verify(token.accessToken)).resolves.toBe(ANA_ID);
    });

    it.each([
      ['the password is wrong', { email: 'ana@example.com', password: 'wrong' }],
      ['the email is unknown', { email: 'nobody@example.com', password: 'ana-password' }],
    ])('throws InvalidCredentialsError when %s', async (_case, credentials) => {
      const result = service.login(credentials);

      await expect(result).rejects.toBeInstanceOf(InvalidCredentialsError);
      await expect(result).rejects.toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user with the id', async () => {
      await expect(service.getCurrentUser(ANA_ID)).resolves.toEqual({
        id: ANA_ID,
        email: 'ana@example.com',
        name: 'Ana',
      });
    });

    it('throws InvalidTokenError when the user no longer exists', async () => {
      const deleted = userIdSchema.parse('00000000-0000-4000-8000-000000000000');

      await expect(service.getCurrentUser(deleted)).rejects.toBeInstanceOf(InvalidTokenError);
    });
  });
});
