import type { JwtModuleOptions } from '@nestjs/jwt';
import type { AppConfig } from '../config/app-config';

export function createJwtOptions(config: AppConfig): JwtModuleOptions {
  return {
    secret: config.auth.jwtSecret,
    signOptions: { algorithm: 'HS256', noTimestamp: true },
    verifyOptions: { algorithms: ['HS256'] },
  };
}
