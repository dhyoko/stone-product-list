import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TokenService } from '../src/auth/token.service';
import { AppConfig } from '../src/config/app-config';
import { Argon2PasswordHasher } from '../src/users/argon2-password-hasher';
import { seedUsers } from '../src/users/seed-users';
import { UsersRepository } from '../src/users/users.repository';
import { createTestTables, deleteTestTables } from './support/test-tables';

const PER_USER = 3;
const PER_IP = 2;
const WINDOW_SECONDS = 60;

const ALICE = { email: 'alice@example.com', name: 'Alice', password: 'alice-password' };
const BOB = { email: 'bob@example.com', name: 'Bob', password: 'bob-password' };

const RATE_LIMITED_BODY = {
  statusCode: 429,
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests. Try again later.',
};

describe('Rate limit (e2e)', () => {
  let app: INestApplication<App>;
  let client: DynamoDBClient;
  let config: AppConfig;
  let aliceToken: string;
  let bobToken: string;

  beforeAll(async () => {
    process.env.RATE_LIMIT_PER_USER = String(PER_USER);
    process.env.RATE_LIMIT_PER_IP = String(PER_IP);
    process.env.RATE_LIMIT_WINDOW_SECONDS = String(WINDOW_SECONDS);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    client = moduleRef.get(DynamoDBClient);
    config = moduleRef.get(AppConfig);
    await createTestTables(client, config);
    const repository = moduleRef.get(UsersRepository);
    await seedUsers({ repository, hasher: new Argon2PasswordHasher(), users: [ALICE, BOB] });
    const tokens = moduleRef.get(TokenService);
    aliceToken = await issueToken({ repository, tokens, email: ALICE.email });
    bobToken = await issueToken({ repository, tokens, email: BOB.email });
    await app.init();
  });

  afterAll(async () => {
    await deleteTestTables(client, config);
    await app.close();
  });

  function getAs(path: string, token: string): request.Test {
    return request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`);
  }

  it('gives each user one budget for all routes', async () => {
    const statuses = [
      (await getAs('/auth/me', aliceToken)).status,
      (await getAs('/products', aliceToken)).status,
      (await getAs('/auth/me', aliceToken)).status,
    ];
    const blocked = await getAs('/products', aliceToken);

    expect(statuses).toEqual([200, 200, 200]);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual(RATE_LIMITED_BODY);
    expect(blocked.headers['retry-after']).toBe(String(WINDOW_SECONDS));
  });

  it('counts each user apart, even from the same IP', async () => {
    const response = await getAs('/products', bobToken);

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBe(String(PER_USER));
    expect(response.headers['x-ratelimit-remaining']).toBe(String(PER_USER - 1));
  });

  it('limits logins per IP, whether they succeed or fail', async () => {
    const login = (password: string): request.Test =>
      request(app.getHttpServer()).post('/auth/login').send({ email: BOB.email, password });

    const statuses = [(await login(BOB.password)).status, (await login('wrong-password')).status];
    const blocked = await login(BOB.password);

    expect(statuses).toEqual([200, 401]);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual(RATE_LIMITED_BODY);
    expect(blocked.headers['retry-after']).toBe(String(WINDOW_SECONDS));
  });

  it('rejects a missing token before it counts the request', async () => {
    const statuses = await Promise.all(
      Array.from({ length: PER_IP + 1 }, async () => {
        const response = await request(app.getHttpServer()).get('/products');
        return response.status;
      }),
    );

    expect(statuses).toEqual(Array.from({ length: PER_IP + 1 }, () => 401));
  });

  it('does not limit the health check', async () => {
    const responses = await Promise.all(
      Array.from({ length: PER_IP + 1 }, () => request(app.getHttpServer()).get('/health')),
    );

    expect(responses.map(({ status }) => status)).toEqual(
      Array.from({ length: PER_IP + 1 }, () => 200),
    );
    expect(responses[0]?.headers['x-ratelimit-limit']).toBeUndefined();
  });
});

async function issueToken(input: {
  readonly repository: UsersRepository;
  readonly tokens: TokenService;
  readonly email: string;
}): Promise<string> {
  const user = await input.repository.findByEmail(input.email);
  if (user === undefined) {
    throw new Error(`Seeded user ${input.email} was not found`);
  }
  return (await input.tokens.issue(user.id)).accessToken;
}
