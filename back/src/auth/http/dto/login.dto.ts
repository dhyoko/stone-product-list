import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@example.com' })
  @IsEmail()
  @MaxLength(254)
  readonly email!: string;

  @ApiProperty({ example: 'demo-password', minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  readonly password!: string;
}
