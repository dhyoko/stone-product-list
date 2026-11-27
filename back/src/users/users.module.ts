import { Module } from '@nestjs/common';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { DynamoUsersRepository } from './infrastructure/dynamo-users.repository';
import { PasswordHasher } from './application/password-hasher';
import { UsersRepository } from './application/users.repository';
import { UsersService } from './application/users.service';

@Module({
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: DynamoUsersRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
  exports: [UsersService],
})
export class UsersModule {}
