import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config';
import { createJwtOptions } from './jwt-options';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.registerAsync({ inject: [AppConfig], useFactory: createJwtOptions })],
  providers: [TokenService],
})
export class AuthModule {}
