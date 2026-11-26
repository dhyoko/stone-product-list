import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AppConfig } from '../config/app-config';
import { PRODUCTS_BY_CREATED_AT_INDEX } from '../database/tables';
import { type Product, productIdSchema, type ProductPosition, type ProductSlice } from './product';
import { ProductAlreadyExistsError } from './product-already-exists.error';
import { ProductsRepository } from './products.repository';

const PRODUCT_LIST_KEY = 'PRODUCT';

const productItemSchema = z.object({
  id: productIdSchema,
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  createdAt: z.iso.datetime().transform((value) => new Date(value)),
});

function indexKeyOf({ id, createdAt }: ProductPosition): {
  readonly id: string;
  readonly listKey: string;
  readonly createdAtId: string;
} {
  return { id, listKey: PRODUCT_LIST_KEY, createdAtId: `${createdAt.toISOString()}#${id}` };
}

@Injectable()
export class DynamoProductsRepository extends ProductsRepository {
  private readonly tableName: string;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    config: AppConfig,
  ) {
    super();
    this.tableName = config.dynamoDb.tables.products;
  }

  async listNewestFirst({
    limit,
    after,
  }: {
    readonly limit: number;
    readonly after?: ProductPosition;
  }): Promise<ProductSlice> {
    const { Items = [], LastEvaluatedKey } = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: PRODUCTS_BY_CREATED_AT_INDEX,
        KeyConditionExpression: 'listKey = :listKey',
        ExpressionAttributeValues: { ':listKey': PRODUCT_LIST_KEY },
        ScanIndexForward: false,
        Limit: limit + 1,
        ExclusiveStartKey: after === undefined ? undefined : indexKeyOf(after),
      }),
    );
    return {
      items: Items.slice(0, limit).map((item) => productItemSchema.parse(item)),
      hasMore: Items.length > limit || LastEvaluatedKey !== undefined,
    };
  }

  async create(product: Product): Promise<void> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            ...indexKeyOf(product),
            name: product.name,
            description: product.description,
            priceInCents: product.priceInCents,
            currency: product.currency,
            createdAt: product.createdAt.toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(id)',
        }),
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new ProductAlreadyExistsError({ cause: error });
      }
      throw error;
    }
  }
}
