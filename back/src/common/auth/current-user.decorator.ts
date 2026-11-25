import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from './authenticated-request';

export function readCurrentUser(_data: unknown, context: ExecutionContext): AuthenticatedUser {
  const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (user === undefined) {
    throw new Error('@CurrentUser() needs a route that the JWT guard protects');
  }
  return user;
}

export const CurrentUser = createParamDecorator(readCurrentUser);
