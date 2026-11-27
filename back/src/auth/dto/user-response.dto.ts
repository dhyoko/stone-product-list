import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../users/domain/user';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid', example: '7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f' })
  readonly id: string;

  @ApiProperty({ example: 'demo@example.com' })
  readonly email: string;

  @ApiProperty({ example: 'Demo User' })
  readonly name: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
  }
}
