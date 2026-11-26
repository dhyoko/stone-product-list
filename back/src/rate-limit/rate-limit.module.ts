import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { RedisModule } from '../redis/redis.module';
import { RateLimitGuard } from './rate-limit.guard';

const ONE_MINUTE_MS = 60_000;
const REQUESTS_PER_MINUTE = 60;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [Redis],
      useFactory: (redis: Redis): ThrottlerModuleOptions => ({
        throttlers: [{ name: 'default', ttl: ONE_MINUTE_MS, limit: REQUESTS_PER_MINUTE }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class RateLimitModule {}
