import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './http/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtAuthGuard } from './http/jwt-auth.guard';
import { createJwtOptions } from './application/jwt-options';
import { TokenService } from './application/token.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({ inject: [AppConfig], useFactory: createJwtOptions }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
