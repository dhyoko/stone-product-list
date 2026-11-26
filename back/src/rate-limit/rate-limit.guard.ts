import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../common/auth/authenticated-request';
import { RateLimitExceededError } from './rate-limit-exceeded.error';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override async getTracker(request: AuthenticatedRequest): Promise<string> {
    if (request.user !== undefined) {
      return `user:${request.user.id}`;
    }
    return `ip:${await super.getTracker(request)}`;
  }

  protected override generateKey(
    _context: unknown,
    tracker: string,
    throttlerName: string,
  ): string {
    return createHash('sha256').update(`${throttlerName}-${tracker}`).digest('hex');
  }

  protected override throwThrottlingException(): Promise<void> {
    return Promise.reject(new RateLimitExceededError());
  }
}
