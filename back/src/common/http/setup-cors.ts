import type { INestApplication } from '@nestjs/common';

export const CORS_EXPOSED_HEADERS = [
  'Retry-After',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
];

export function setupCors(app: INestApplication, origins: readonly string[]): void {
  if (origins.length === 0) {
    return;
  }
  app.enableCors({ origin: [...origins], exposedHeaders: CORS_EXPOSED_HEADERS, maxAge: 600 });
}
