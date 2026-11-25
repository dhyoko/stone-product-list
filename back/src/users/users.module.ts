import { Module } from '@nestjs/common';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import { DynamoUsersRepository } from './dynamo-users.repository';
import { PasswordHasher } from './password-hasher';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: DynamoUsersRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
  exports: [UsersService],
})
export class UsersModule {}
