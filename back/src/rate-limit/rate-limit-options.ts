import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../common/auth/authenticated-request';
import type { RateLimitConfig } from '../config/app-config';

const MS_PER_SECOND = 1000;

export function createRateLimitOptions(input: {
  readonly config: RateLimitConfig;
  readonly storage?: ThrottlerStorage;
}): ThrottlerModuleOptions {
  const { config, storage } = input;
  return {
    throttlers: [
      {
        name: 'default',
        ttl: config.windowSeconds * MS_PER_SECOND,
        limit: (context: ExecutionContext): number =>
          context.switchToHttp().getRequest<AuthenticatedRequest>().user === undefined
            ? config.perIp
            : config.perUser,
      },
    ],
    ...(storage === undefined ? {} : { storage }),
  };
}
