import { Test } from '@nestjs/testing';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ThrottlerModule } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../common/auth/authenticated-request';
import { userIdSchema } from '../users/user';
import { RateLimitExceededError } from './rate-limit-exceeded.error';
import { RateLimitGuard } from './rate-limit.guard';

class ProductsController {
  list(): void {
    return undefined;
  }
}

class AuthController {
  me(): void {
    return undefined;
  }
}

const ALICE: AuthenticatedUser = { id: userIdSchema.parse('0b6f0d4e-8f43-4c51-9d0a-0f2c3a1b9e01') };
const BOB: AuthenticatedUser = { id: userIdSchema.parse('7c1a2b3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d') };

interface FakeResponse {
  readonly header: jest.Mock;
}

function buildContext(input: {
  readonly ip: string;
  readonly user?: AuthenticatedUser;
  readonly route?: 'products' | 'me';
}): {
  readonly context: ExecutionContextHost;
  readonly response: FakeResponse;
} {
  const request = { ip: input.ip, headers: {}, user: input.user };
  const response: FakeResponse = { header: jest.fn() };
  const context =
    input.route === 'me'
      ? new ExecutionContextHost([request, response], AuthController, AuthController.prototype.me)
      : new ExecutionContextHost(
          [request, response],
          ProductsController,
          ProductsController.prototype.list,
        );
  return { context, response };
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 1 }] })],
      providers: [RateLimitGuard],
    }).compile();
    guard = moduleRef.get(RateLimitGuard);
    await guard.onModuleInit();
  });

  it('lets a request through while it is under the limit', async () => {
    const { context, response } = buildContext({ ip: '203.0.113.7', user: ALICE });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(response.header).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
  });

  it('rejects a request over the limit with a retry delay', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE }).context);
    const { context, response } = buildContext({ ip: '203.0.113.7', user: ALICE });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(RateLimitExceededError);
    expect(response.header).toHaveBeenCalledWith('Retry-After', 60);
  });

  it('counts each user apart, even from the same IP', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE }).context);

    await expect(
      guard.canActivate(buildContext({ ip: '203.0.113.7', user: BOB }).context),
    ).resolves.toBe(true);
  });

  it('counts the same user as one, even from different IPs', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE }).context);

    await expect(
      guard.canActivate(buildContext({ ip: '198.51.100.9', user: ALICE }).context),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it('counts a request with no user by its IP', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7' }).context);

    await expect(guard.canActivate(buildContext({ ip: '198.51.100.9' }).context)).resolves.toBe(
      true,
    );
    await expect(
      guard.canActivate(buildContext({ ip: '203.0.113.7' }).context),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it('keeps the IP count apart from the user count', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE }).context);

    await expect(guard.canActivate(buildContext({ ip: '203.0.113.7' }).context)).resolves.toBe(
      true,
    );
  });

  it('shares one count across all routes for a user', async () => {
    await guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE }).context);

    await expect(
      guard.canActivate(buildContext({ ip: '203.0.113.7', user: ALICE, route: 'me' }).context),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
