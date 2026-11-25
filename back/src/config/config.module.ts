import { Global, Module } from '@nestjs/common';
import { AppConfig } from './app-config';
import { loadConfig, loadEnvFile } from './load-config';

@Global()
@Module({
  providers: [
    {
      provide: AppConfig,
      useFactory: (): AppConfig => {
        loadEnvFile('.env', process.env);
        return loadConfig(process.env);
      },
    },
  ],
  exports: [AppConfig],
})
export class ConfigModule {}
