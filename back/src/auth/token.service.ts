import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { AppConfig } from '../config/app-config';
import { type UserId, userIdSchema } from '../users/user';
import { InvalidTokenError } from './invalid-token.error';

const tokenPayloadSchema = z.object({ sub: userIdSchema });

export interface AccessToken {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
}

@Injectable()
export class TokenService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    config: AppConfig,
  ) {
    this.ttlSeconds = config.auth.accessTokenTtlSeconds;
  }

  async issue(userId: UserId): Promise<AccessToken> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: this.ttlSeconds },
    );
    return { accessToken, expiresInSeconds: this.ttlSeconds };
  }

  async verify(token: string): Promise<UserId> {
    let payload: unknown;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new InvalidTokenError({ cause: error });
    }
    const result = tokenPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new InvalidTokenError({ cause: result.error });
    }
    return result.data.sub;
  }
}
