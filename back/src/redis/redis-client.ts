import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import type { RedisConfig } from '../config/app-config';

const logger = new Logger('RedisClient');

export function createRedisClient(config: RedisConfig): Redis {
  const client = new Redis(config.url, { lazyConnect: true });
  client.on('error', (error: NodeJS.ErrnoException) => {
    logger.warn(`Redis connection error: ${describeError(error)}`);
  });
  return client;
}

function describeError(error: NodeJS.ErrnoException): string {
  return error.message === '' ? (error.code ?? error.name) : error.message;
}

export async function connectRedisClient(client: Redis): Promise<Redis> {
  try {
    await client.connect();
    return client;
  } catch (error) {
    client.disconnect();
    throw error;
  }
}
