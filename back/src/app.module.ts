import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { createValidationPipe } from './common/validation/create-validation-pipe';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ConfigModule, DatabaseModule, RedisModule, HealthModule, AuthModule, ProductsModule],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule {}
