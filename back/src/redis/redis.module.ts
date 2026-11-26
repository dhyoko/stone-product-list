import { Module, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfig } from '../config/app-config';
import { connectRedisClient, createRedisClient } from './redis-client';

@Module({
  providers: [
    {
      provide: Redis,
      inject: [AppConfig],
      useFactory: (config: AppConfig): Promise<Redis> =>
        connectRedisClient(createRedisClient(config.redis)),
    },
  ],
  exports: [Redis],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
