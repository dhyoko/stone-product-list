import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { PasswordHasher } from '../application/password-hasher';

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify({
    hash,
    password,
  }: {
    readonly hash: string;
    readonly password: string;
  }): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
