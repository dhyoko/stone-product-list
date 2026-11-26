import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { AppConfig } from '../config/app-config';
import { RedisModule } from '../redis/redis.module';
import { createRateLimitOptions } from './rate-limit-options';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [AppConfig, Redis],
      useFactory: (config: AppConfig, redis: Redis): ThrottlerModuleOptions =>
        createRateLimitOptions({
          config: config.rateLimit,
          storage: new ThrottlerStorageRedisService(redis),
        }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class RateLimitModule {}
