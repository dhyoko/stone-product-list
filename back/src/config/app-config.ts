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

/**
 * Typed application config. Inject this class instead of reading `process.env`.
 */
export class AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly http: { readonly port: number };
  readonly dynamoDb: DynamoDbConfig;

  constructor(env: Env) {
    this.nodeEnv = env.NODE_ENV;
    this.http = { port: env.PORT };
    this.dynamoDb = {
      region: env.AWS_REGION,
      localEndpoint: env.DYNAMODB_LOCAL_ENDPOINT,
      tables: { users: env.USERS_TABLE, products: env.PRODUCTS_TABLE },
    };
  }
}
