import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { buildOpenApiConfig, buildOpenApiDocument } from './setup-openapi';

describe('buildOpenApiConfig', () => {
  const config = buildOpenApiConfig();

  it('names the API and its version', () => {
    expect(config.info.title).toBe('Product API');
    expect(config.info.version).toBe('1.0.0');
  });

  it('declares the JWT bearer scheme', () => {
    expect(config.components?.securitySchemes).toEqual({
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    });
  });
});

describe('buildOpenApiDocument', () => {
  it('documents every route of the app without starting its providers', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile({
      preview: true,
    });
    const app = moduleRef.createNestApplication();

    const document = buildOpenApiDocument(app);

    expect(Object.keys(document.paths)).toEqual([
      '/health',
      '/auth/login',
      '/auth/me',
      '/products',
    ]);
    expect(document.paths['/products']?.get?.security).toEqual([{ bearer: [] }]);
  });
});
