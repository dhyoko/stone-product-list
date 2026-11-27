import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupCors } from '../src/common/http/setup-cors';
import { AppConfig } from '../src/config/app-config';

const ALLOWED_ORIGIN = 'http://localhost:5173';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.CORS_ORIGINS = ALLOWED_ORIGIN;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupCors(app, moduleRef.get(AppConfig).http.corsOrigins);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers a preflight from an allowed origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/products')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(response.headers['access-control-allow-headers']).toBe('authorization');
  });

  it('exposes the rate limit headers to an allowed origin', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ALLOWED_ORIGIN)
      .send({ email: 'nobody@example.com', password: 'wrong-password' });

    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(response.headers['access-control-expose-headers']).toBe(
      'Retry-After,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset',
    );
  });

  it('sends no CORS headers to another origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
