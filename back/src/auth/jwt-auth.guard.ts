import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../common/auth/authenticated-request';
import { IS_PUBLIC_KEY } from '../common/auth/public.decorator';
import { InvalidTokenError } from './invalid-token.error';
import { TokenService } from './token.service';

const BEARER_PATTERN = /^Bearer (?<token>\S+)$/i;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = BEARER_PATTERN.exec(request.headers.authorization ?? '')?.groups?.token;
    if (token === undefined) {
      throw new InvalidTokenError();
    }
    request.user = { id: await this.tokenService.verify(token) };
    return true;
  }
}
