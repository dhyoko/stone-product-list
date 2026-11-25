import { Injectable } from '@nestjs/common';
import type { User, UserId } from '../users/user';
import { UsersService } from '../users/users.service';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { InvalidTokenError } from './invalid-token.error';
import { type AccessToken, TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async login(credentials: {
    readonly email: string;
    readonly password: string;
  }): Promise<AccessToken> {
    const user = await this.usersService.verifyCredentials(credentials);
    if (user === undefined) {
      throw new InvalidCredentialsError();
    }
    return this.tokenService.issue(user.id);
  }

  async getCurrentUser(id: UserId): Promise<User> {
    const user = await this.usersService.findById(id);
    if (user === undefined) {
      throw new InvalidTokenError();
    }
    return user;
  }
}
