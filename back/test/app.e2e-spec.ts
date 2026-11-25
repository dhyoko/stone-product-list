import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/common/openapi/setup-openapi';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('reports an ok status', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /docs/openapi.json', () => {
    it('serves the OpenAPI spec with the routes and the bearer scheme', async () => {
      const response = await request(app.getHttpServer()).get('/docs/openapi.json');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        info: { title: 'Product API', version: '1.0.0' },
        paths: { '/health': { get: { tags: ['health'] } } },
        components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
      });
    });
  });

  describe('an unknown route', () => {
    it('returns the standard error body', async () => {
      const response = await request(app.getHttpServer()).get('/missing');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Cannot GET /missing',
      });
    });
  });
});
