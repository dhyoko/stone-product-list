import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupOpenApi } from './common/openapi/setup-openapi';
import { AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  setupOpenApi(app);
  const config = app.get(AppConfig);
  await app.listen(config.http.port);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error('Application failed to start', error);
  process.exit(1);
});
