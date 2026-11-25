import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ErrorBody } from './error-body';

export class ErrorResponseDto implements ErrorBody {
  @ApiProperty({ example: 401 })
  readonly statusCode!: number;

  @ApiProperty({ example: 'AUTH_INVALID_CREDENTIALS' })
  readonly code!: string;

  @ApiProperty({ example: 'Invalid email or password' })
  readonly message!: string;

  @ApiPropertyOptional({ type: [String], example: ['email must be an email'] })
  readonly details?: readonly string[];
}
