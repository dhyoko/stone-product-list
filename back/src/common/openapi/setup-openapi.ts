import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_PATH = 'docs';
export const OPENAPI_JSON_PATH = 'docs/openapi.json';

export function buildOpenApiConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Product API')
    .setDescription('Log in to get a JWT, then use it to list products.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
}

export function setupOpenApi(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  SwaggerModule.setup(OPENAPI_PATH, app, document, { jsonDocumentUrl: OPENAPI_JSON_PATH });
}
