import { ApiProperty } from '@nestjs/swagger';
import type { AccessToken } from '../token.service';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  readonly accessToken: string;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  readonly tokenType = 'Bearer';

  @ApiProperty({ description: 'Seconds until the access token expires', example: 900 })
  readonly expiresIn: number;

  constructor(token: AccessToken) {
    this.accessToken = token.accessToken;
    this.expiresIn = token.expiresInSeconds;
  }
}
