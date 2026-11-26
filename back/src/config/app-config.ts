import type { Env } from './env.schema';

export interface TableNames {
  readonly users: string;
  readonly products: string;
}

export interface DynamoDbConfig {
  readonly region: string;
  readonly localEndpoint: string | undefined;
  readonly tables: TableNames;
}

export interface RedisConfig {
  readonly url: string;
  readonly keyPrefix: string;
}

export interface AuthConfig {
  readonly jwtSecret: string;
  readonly accessTokenTtlSeconds: number;
}

export interface RateLimitConfig {
  readonly windowSeconds: number;
  readonly perUser: number;
  readonly perIp: number;
}

/**
 * Typed application config. Inject this class instead of reading `process.env`.
 */
export class AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly http: { readonly port: number };
  readonly dynamoDb: DynamoDbConfig;
  readonly redis: RedisConfig;
  readonly auth: AuthConfig;
  readonly rateLimit: RateLimitConfig;

  constructor(env: Env) {
    this.nodeEnv = env.NODE_ENV;
    this.http = { port: env.PORT };
    this.dynamoDb = {
      region: env.AWS_REGION,
      localEndpoint: env.DYNAMODB_LOCAL_ENDPOINT,
      tables: { users: env.USERS_TABLE, products: env.PRODUCTS_TABLE },
    };
    this.redis = { url: env.REDIS_URL, keyPrefix: env.REDIS_KEY_PREFIX };
    this.auth = {
      jwtSecret: env.JWT_SECRET,
      accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    };
    this.rateLimit = {
      windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
      perUser: env.RATE_LIMIT_PER_USER,
      perIp: env.RATE_LIMIT_PER_IP,
    };
  }
}
