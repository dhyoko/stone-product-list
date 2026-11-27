import { Controller, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../common/auth/authenticated-request';
import { Public } from '../common/auth/public.decorator';
import { AppConfig } from '../config/app-config';
import { buildTestConfig } from '../config/testing/test-config';
import { userIdSchema } from '../users/domain/user';
import { InvalidTokenError } from './invalid-token.error';
import { JwtAuthGuard } from './jwt-auth.guard';
import { createJwtOptions } from './jwt-options';
import { TokenService } from './token.service';

const USER_ID = userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f');

@Controller()
class ProtectedController {
  @Get()
  read(): void {}

  @Public()
  @Get('open')
  open(): void {}
}

@Public()
@Controller()
class PublicController {
  @Get()
  read(): void {}
}

function contextFor(
  request: Partial<AuthenticatedRequest>,
  controller: new () => object,
  handler: () => void,
): ExecutionContextHost {
  return new ExecutionContextHost([request], controller, handler);
}

describe('JwtAuthGuard', () => {
  const config = buildTestConfig();

  let guard: JwtAuthGuard;
  let tokenService: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register(createJwtOptions(config))],
      providers: [JwtAuthGuard, TokenService, Reflector, { provide: AppConfig, useValue: config }],
    }).compile();

    guard = moduleRef.get(JwtAuthGuard);
    tokenService = moduleRef.get(TokenService);
    jwtService = moduleRef.get(JwtService);
  });

  function protectedContext(authorization?: string): {
    readonly context: ExecutionContextHost;
    readonly request: Partial<AuthenticatedRequest>;
  } {
    const request: Partial<AuthenticatedRequest> = {
      headers: authorization === undefined ? {} : { authorization },
    };
    const context = contextFor(request, ProtectedController, ProtectedController.prototype.read);
    return { context, request };
  }

  it('lets a request through a public route without a token', async () => {
    const context = contextFor(
      { headers: {} },
      ProtectedController,
      ProtectedController.prototype.open,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('lets a request through a route of a public controller without a token', async () => {
    const context = contextFor({ headers: {} }, PublicController, PublicController.prototype.read);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('puts the user from a valid bearer token on the request', async () => {
    const { accessToken } = await tokenService.issue(USER_ID);
    const { context, request } = protectedContext(`Bearer ${accessToken}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: USER_ID });
  });

  it('accepts the bearer scheme in any case', async () => {
    const { accessToken } = await tokenService.issue(USER_ID);
    const { context } = protectedContext(`bearer ${accessToken}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it.each([
    ['no Authorization header', undefined],
    ['an empty header', ''],
    ['another scheme', 'Basic ZGVtbzpkZW1v'],
    ['a scheme without a token', 'Bearer '],
    ['a token with spaces', 'Bearer one two'],
  ])('rejects a request with %s', async (_case, authorization) => {
    const { context, request } = protectedContext(authorization);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InvalidTokenError);
    expect(request.user).toBeUndefined();
  });

  it('rejects an expired token', async () => {
    const token = await jwtService.signAsync({ sub: USER_ID }, { expiresIn: -1 });
    const { context } = protectedContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
  });
});
