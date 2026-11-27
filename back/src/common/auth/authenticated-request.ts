import type { Request } from 'express';
import type { UserId } from '../../users/domain/user';

export interface AuthenticatedUser {
  readonly id: UserId;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
