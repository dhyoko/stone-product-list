import type { Env } from './env.schema';

/**
 * Typed application config. Inject this class instead of reading `process.env`.
 */
export class AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly http: { readonly port: number };

  constructor(env: Env) {
    this.nodeEnv = env.NODE_ENV;
    this.http = { port: env.PORT };
  }
}
