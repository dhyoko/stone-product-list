import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger, type NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { buildOpenApiDocument } from '../common/openapi/setup-openapi';

const OUTPUT_PATH = resolve(__dirname, '../../../docs/openapi.json');

const PREVIEW: Pick<NestApplicationOptions, 'preview'> = { preview: true };

const logger = new Logger('ExportOpenApi');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, PREVIEW);
  const document = buildOpenApiDocument(app);
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`);
  logger.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  logger.error('Could not export the OpenAPI spec', error);
  process.exit(1);
});
