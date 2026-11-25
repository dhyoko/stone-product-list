import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import type { TableNames } from '../config/app-config';

export type TableDefinition = CreateTableCommandInput & { readonly TableName: string };

export const USERS_BY_ID_INDEX = 'byId';

export const PRODUCTS_BY_CREATED_AT_INDEX = 'byCreatedAt';

export function buildTableDefinitions(names: TableNames): readonly TableDefinition[] {
  return [
    {
      TableName: names.users,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: USERS_BY_ID_INDEX,
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
    {
      TableName: names.products,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'listKey', AttributeType: 'S' },
        { AttributeName: 'createdAtId', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: PRODUCTS_BY_CREATED_AT_INDEX,
          KeySchema: [
            { AttributeName: 'listKey', KeyType: 'HASH' },
            { AttributeName: 'createdAtId', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  ];
}
