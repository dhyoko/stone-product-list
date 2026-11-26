import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app-config';
import { buildDemoProducts } from '../src/products/demo-products';
import { ProductsRepository } from '../src/products/products.repository';
import { seedProducts } from '../src/products/seed-products';
import { Argon2PasswordHasher } from '../src/users/argon2-password-hasher';
import { seedUsers } from '../src/users/seed-users';
import { UsersRepository } from '../src/users/users.repository';
import { logIn } from './support/log-in';
import { createTestTables, deleteTestTables } from './support/test-tables';

const pageSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      id: z.uuid(),
      name: z.string(),
      description: z.string(),
      priceInCents: z.number().int(),
      currency: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

type Page = z.infer<typeof pageSchema>;

const DEMO = { email: 'demo@example.com', name: 'Demo User', password: 'demo-password' };
const PRODUCTS = buildDemoProducts();
const NEWEST_FIRST_IDS = [...PRODUCTS]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .map(({ id }) => id);

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let client: DynamoDBClient;
  let config: AppConfig;
  let token: string;

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
    await seedProducts({ repository: moduleRef.get(ProductsRepository), products: PRODUCTS });
    await app.init();
    token = await logIn(app, DEMO);
  });

  afterAll(async () => {
    await deleteTestTables(client, config);
    await app.close();
  });

  async function getPage(query: Record<string, string>): Promise<request.Response> {
    return request(app.getHttpServer())
      .get('/products')
      .query(query)
      .set('Authorization', `Bearer ${token}`);
  }

  async function getValidPage(query: Record<string, string>): Promise<Page> {
    const response = await getPage(query);
    expect(response.status).toBe(200);
    return pageSchema.parse(response.body);
  }

  describe('GET /products', () => {
    it('returns the 20 newest products and a cursor by default', async () => {
      const page = await getValidPage({});

      expect(page.items.map(({ id }) => id)).toEqual(NEWEST_FIRST_IDS.slice(0, 20));
      expect(page.nextCursor).not.toBeNull();
    });

    it('returns every product once, newest first, across pages', async () => {
      const ids: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const page: Page = await getValidPage({
          limit: '7',
          ...(cursor === null ? {} : { cursor }),
        });
        ids.push(...page.items.map(({ id }) => id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null && pages < 20);

      expect(pages).toBe(8);
      expect(ids).toEqual(NEWEST_FIRST_IDS);
    });

    it('returns a null cursor when one page holds every product', async () => {
      const page = await getValidPage({ limit: '50' });

      expect(page.items).toHaveLength(50);
      expect(page.nextCursor).toBeNull();
    });

    it('returns the product fields with the price in cents', async () => {
      const page = await getValidPage({ limit: '1' });
      const newest = PRODUCTS.find(({ id }) => id === NEWEST_FIRST_IDS[0]);

      expect(page.items[0]).toEqual({
        id: newest?.id,
        name: newest?.name,
        description: newest?.description,
        priceInCents: newest?.priceInCents,
        currency: 'BRL',
        createdAt: newest?.createdAt.toISOString(),
      });
    });

    it.each(['0', '101', 'ten'])('returns 400 for a limit of %p', async (limit) => {
      const response = await getPage({ limit });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('returns 400 for a cursor that does not decode', async () => {
      const response = await getPage({ cursor: 'bm90LWEtY3Vyc29y' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'PRODUCTS_INVALID_CURSOR' });
    });

    it('returns 400 for an unknown query parameter', async () => {
      const response = await getPage({ page: '2' });

      expect(response.status).toBe(400);
    });

    it('returns 401 without a token', async () => {
      const response = await request(app.getHttpServer()).get('/products');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
    });
  });
});
