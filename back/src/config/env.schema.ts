import { z } from 'zod';

const tableName = z.string().regex(/^[a-zA-Z0-9_.-]{3,255}$/);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  DYNAMODB_LOCAL_ENDPOINT: z.url().optional(),
  USERS_TABLE: tableName.default('product-api-users'),
  PRODUCTS_TABLE: tableName.default('product-api-products'),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }).default('redis://localhost:6379'),
  REDIS_KEY_PREFIX: z
    .string()
    .regex(/^[a-zA-Z0-9:_-]{0,64}$/)
    .default('product-api:'),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
  RATE_LIMIT_PER_USER: z.coerce.number().int().min(1).max(10_000).default(60),
  RATE_LIMIT_PER_IP: z.coerce.number().int().min(1).max(10_000).default(5),
});

export type Env = z.infer<typeof envSchema>;
