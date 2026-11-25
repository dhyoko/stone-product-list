import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app-config';
import { Argon2PasswordHasher } from '../src/users/argon2-password-hasher';
import { seedUsers } from '../src/users/seed-users';
import { UsersRepository } from '../src/users/users.repository';
import { createTestTables, deleteTestTables } from './support/test-tables';

const loginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number(),
});

const DEMO = { email: 'demo@example.com', name: 'Demo User', password: 'demo-password' };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let client: DynamoDBClient;
  let config: AppConfig;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    client = moduleRef.get(DynamoDBClient);
    config = moduleRef.get(AppConfig);
    await createTestTables(client, config);
    await seedUsers({
      repository: moduleRef.get(UsersRepository),
      hasher: new Argon2PasswordHasher(),
      users: [DEMO],
    });
    await app.init();
  });

  afterAll(async () => {
    await deleteTestTables(client, config);
    await app.close();
  });

  async function logIn(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: DEMO.email, password: DEMO.password });
    return loginResponseSchema.parse(response.body).accessToken;
  }

  describe('POST /auth/login', () => {
    it('returns a bearer token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'Demo@Example.com', password: DEMO.password });

      expect(response.status).toBe(200);
      expect(loginResponseSchema.parse(response.body)).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    });

    it.each([
      ['a wrong password', { email: DEMO.email, password: 'wrong-password' }],
      ['an unknown email', { email: 'nobody@example.com', password: DEMO.password }],
    ])('returns the same 401 for %s', async (_case, body) => {
      const response = await request(app.getHttpServer()).post('/auth/login').send(body);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('returns 400 with every problem for an invalid body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', role: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'BAD_REQUEST' });
      expect(response.body).toHaveProperty(
        'details',
        expect.arrayContaining(['property role should not exist']),
      );
    });
  });

  describe('GET /auth/me', () => {
    it('returns the user that the token belongs to', async () => {
      const token = await logIn();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/) as string,
        email: DEMO.email,
        name: DEMO.name,
      });
    });

    it.each([
      ['no token', undefined],
      ['a token that is not a JWT', 'Bearer not-a-token'],
      ['another scheme', 'Basic ZGVtbzpkZW1v'],
    ])('returns 401 with %s', async (_case, authorization) => {
      const call = request(app.getHttpServer()).get('/auth/me');
      const response = await (authorization === undefined
        ? call
        : call.set('Authorization', authorization));

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
    });

    it('returns 401 for an expired token', async () => {
      const expired = await app
        .get(JwtService)
        .signAsync({ sub: '7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f' }, { expiresIn: -1 });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(response.status).toBe(401);
    });

    it('returns 401 for a valid token whose user no longer exists', async () => {
      const orphan = await app
        .get(JwtService)
        .signAsync({ sub: '00000000-0000-4000-8000-000000000000' }, { expiresIn: 60 });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${orphan}`);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
    });
  });
});
