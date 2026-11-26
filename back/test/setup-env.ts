import { randomUUID } from 'node:crypto';

const runId = randomUUID().slice(0, 8);

process.env.JWT_SECRET ??= 'e2e-secret-that-is-at-least-32-characters';
process.env.DYNAMODB_LOCAL_ENDPOINT ??= 'http://localhost:8000';
process.env.USERS_TABLE = `e2e-${runId}-users`;
process.env.PRODUCTS_TABLE = `e2e-${runId}-products`;
process.env.RATE_LIMIT_PER_USER = '10000';
process.env.RATE_LIMIT_PER_IP = '10000';
