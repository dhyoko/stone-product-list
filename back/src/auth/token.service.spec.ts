import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { z } from 'zod';
import { AppConfig } from '../config/app-config';
import { buildTestConfig, TEST_JWT_SECRET } from '../config/testing/test-config';
import { userIdSchema } from '../users/domain/user';
import { InvalidTokenError } from './invalid-token.error';
import { createJwtOptions } from './jwt-options';
import { TokenService } from './token.service';

const payloadSchema = z.strictObject({ sub: z.string(), exp: z.number() });

const USER_ID = userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f');

function decodeSegment(token: string, index: number): unknown {
  const segment = token.split('.')[index] ?? '';
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

function encodeSegment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

describe('TokenService', () => {
  const config = buildTestConfig({ ACCESS_TOKEN_TTL_SECONDS: '900' });

  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register(createJwtOptions(config))],
      providers: [TokenService, { provide: AppConfig, useValue: config }],
    }).compile();

    service = moduleRef.get(TokenService);
    jwtService = moduleRef.get(JwtService);
  });

  describe('issue', () => {
    it('signs an HS256 token that holds only the user id and the expiry', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);

      const { accessToken, expiresInSeconds } = await service.issue(USER_ID);

      expect(expiresInSeconds).toBe(900);
      expect(decodeSegment(accessToken, 0)).toEqual({ alg: 'HS256', typ: 'JWT' });
      const payload = payloadSchema.parse(decodeSegment(accessToken, 1));
      expect(payload.sub).toBe(USER_ID);
      expect(payload.exp - nowSeconds).toBeGreaterThanOrEqual(900);
      expect(payload.exp - nowSeconds).toBeLessThanOrEqual(901);
    });
  });

  describe('verify', () => {
    it('returns the user id of a token it issued', async () => {
      const { accessToken } = await service.issue(USER_ID);

      await expect(service.verify(accessToken)).resolves.toBe(USER_ID);
    });

    it.each([
      ['an empty string', ''],
      ['a value that is not a JWT', 'not-a-token'],
    ])('rejects %s', async (_case, token) => {
      await expect(service.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
    });

    it('rejects an expired token', async () => {
      const token = await jwtService.signAsync({ sub: USER_ID }, { expiresIn: -1 });

      await expect(service.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
    });

    it('rejects a token signed with another secret', async () => {
      const token = await jwtService.signAsync(
        { sub: USER_ID },
        { expiresIn: 60, secret: `${TEST_JWT_SECRET}-other` },
      );

      await expect(service.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
    });

    it('rejects an unsigned token that uses the none algorithm', async () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = `${encodeSegment({ alg: 'none', typ: 'JWT' })}.${encodeSegment({ sub: USER_ID, exp })}.`;

      await expect(service.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
    });

    it('rejects a signed token whose subject is not a user id', async () => {
      const token = await jwtService.signAsync({ sub: 'admin' }, { expiresIn: 60 });

      const result = service.verify(token);

      await expect(result).rejects.toBeInstanceOf(InvalidTokenError);
      await expect(result).rejects.toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
    });
  });
});
