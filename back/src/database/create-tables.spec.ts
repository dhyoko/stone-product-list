import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { createTables } from './create-tables';
import type { TableDefinition } from './tables';

const users: TableDefinition = {
  TableName: 'users',
  AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
  KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
};
const products: TableDefinition = { ...users, TableName: 'products' };

describe('createTables', () => {
  const client = new DynamoDBClient({ region: 'us-east-1' });
  const dynamoDb = mockClient(client);

  beforeEach(() => {
    dynamoDb.reset();
    dynamoDb.on(DescribeTableCommand).resolves({ Table: { TableStatus: 'ACTIVE' } });
  });

  it('creates each table and waits until it is active', async () => {
    dynamoDb.on(CreateTableCommand).resolves({});

    const results = await createTables(client, [users, products]);

    expect(results).toEqual([
      { tableName: 'users', outcome: 'created' },
      { tableName: 'products', outcome: 'created' },
    ]);
    expect(dynamoDb.commandCalls(CreateTableCommand).map((call) => call.args[0].input)).toEqual([
      users,
      products,
    ]);
    expect(dynamoDb.commandCalls(DescribeTableCommand)).toHaveLength(2);
  });

  it('leaves a table that already exists unchanged', async () => {
    dynamoDb
      .on(CreateTableCommand, { TableName: 'users' })
      .rejects(new ResourceInUseException({ message: 'Table already exists', $metadata: {} }))
      .on(CreateTableCommand, { TableName: 'products' })
      .resolves({});

    const results = await createTables(client, [users, products]);

    expect(results).toEqual([
      { tableName: 'users', outcome: 'already_exists' },
      { tableName: 'products', outcome: 'created' },
    ]);
    expect(dynamoDb.commandCalls(DescribeTableCommand)).toHaveLength(1);
  });

  it('rethrows any other error', async () => {
    const error = new Error('Network is unreachable');
    dynamoDb.on(CreateTableCommand).rejects(error);

    await expect(createTables(client, [users])).rejects.toBe(error);
  });
});
