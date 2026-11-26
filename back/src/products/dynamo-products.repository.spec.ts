import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Test } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { ZodError } from 'zod';
import { AppConfig } from '../config/app-config';
import { buildTestConfig } from '../config/testing/test-config';
import { DynamoProductsRepository } from './dynamo-products.repository';
import { type Product, productIdSchema } from './product';
import { ProductAlreadyExistsError } from './product-already-exists.error';

const product: Product = {
  id: productIdSchema.parse('2b1e4c7a-8d3f-4a6b-9c2e-5f7a1b3c4d5e'),
  name: 'Coffee mug',
  description: 'A 350 ml ceramic mug',
  priceInCents: 4990,
  currency: 'BRL',
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
};

const item = {
  id: product.id,
  listKey: 'PRODUCT',
  createdAtId: `2026-11-20T10:00:00.000Z#${product.id}`,
  name: 'Coffee mug',
  description: 'A 350 ml ceramic mug',
  priceInCents: 4990,
  currency: 'BRL',
  createdAt: '2026-11-20T10:00:00.000Z',
};

describe('DynamoProductsRepository', () => {
  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
  const dynamoDb = mockClient(documentClient);
  const config = buildTestConfig({ PRODUCTS_TABLE: 'test-products' });

  let repository: DynamoProductsRepository;

  beforeEach(async () => {
    dynamoDb.reset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DynamoProductsRepository,
        { provide: DynamoDBDocumentClient, useValue: documentClient },
        { provide: AppConfig, useValue: config },
      ],
    }).compile();

    repository = moduleRef.get(DynamoProductsRepository);
  });

  describe('listNewestFirst', () => {
    it('queries the byCreatedAt index newest first for one extra item', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [item] });

      await repository.listNewestFirst({ limit: 20 });

      expect(dynamoDb.commandCalls(QueryCommand)[0]?.args[0].input).toEqual({
        TableName: 'test-products',
        IndexName: 'byCreatedAt',
        KeyConditionExpression: 'listKey = :listKey',
        ExpressionAttributeValues: { ':listKey': 'PRODUCT' },
        ScanIndexForward: false,
        Limit: 21,
        ExclusiveStartKey: undefined,
      });
    });

    it('starts after the given position', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [] });

      await repository.listNewestFirst({ limit: 20, after: product });

      expect(dynamoDb.commandCalls(QueryCommand)[0]?.args[0].input.ExclusiveStartKey).toEqual({
        id: product.id,
        listKey: 'PRODUCT',
        createdAtId: `2026-11-20T10:00:00.000Z#${product.id}`,
      });
    });

    it('maps the items to products', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [item] });

      await expect(repository.listNewestFirst({ limit: 20 })).resolves.toEqual({
        items: [product],
        hasMore: false,
      });
    });

    it('drops the extra item and reports more when the query returns one', async () => {
      const second = { ...item, id: '3c2f5d8b-9e4a-4b7c-8d3f-6a8b2c4d5e6f' };
      dynamoDb.on(QueryCommand).resolves({ Items: [item, second], LastEvaluatedKey: second });

      const slice = await repository.listNewestFirst({ limit: 1 });

      expect(slice.items).toEqual([product]);
      expect(slice.hasMore).toBe(true);
    });

    it('reports more when DynamoDB stops early before the limit', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [item], LastEvaluatedKey: item });

      await expect(repository.listNewestFirst({ limit: 5 })).resolves.toMatchObject({
        hasMore: true,
      });
    });

    it('returns an empty slice when the query returns no list', async () => {
      dynamoDb.on(QueryCommand).resolves({});

      await expect(repository.listNewestFirst({ limit: 20 })).resolves.toEqual({
        items: [],
        hasMore: false,
      });
    });

    it('rejects an item with a negative price', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [{ ...item, priceInCents: -1 }] });

      await expect(repository.listNewestFirst({ limit: 20 })).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('create', () => {
    it('writes the product with its index keys when the id is free', async () => {
      dynamoDb.on(PutCommand).resolves({});

      await repository.create(product);

      expect(dynamoDb.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
        TableName: 'test-products',
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)',
      });
    });

    it('throws ProductAlreadyExistsError when the id is taken', async () => {
      const conflict = new ConditionalCheckFailedException({
        message: 'The conditional request failed',
        $metadata: {},
      });
      dynamoDb.on(PutCommand).rejects(conflict);

      const result = repository.create(product);

      await expect(result).rejects.toBeInstanceOf(ProductAlreadyExistsError);
      await expect(result).rejects.toMatchObject({
        code: 'PRODUCT_ALREADY_EXISTS',
        cause: conflict,
      });
    });

    it('rethrows any other error', async () => {
      const error = new Error('Network is unreachable');
      dynamoDb.on(PutCommand).rejects(error);

      await expect(repository.create(product)).rejects.toBe(error);
    });
  });
});
