import { buildOpenApiConfig } from './setup-openapi';

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
