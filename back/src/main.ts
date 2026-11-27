import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupCors } from './common/http/setup-cors';
import { setupOpenApi } from './common/openapi/setup-openapi';
import { AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get(AppConfig);
  setupCors(app, config.http.corsOrigins);
  setupOpenApi(app);
  await app.listen(config.http.port);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error('Application failed to start', error);
  process.exit(1);
});
