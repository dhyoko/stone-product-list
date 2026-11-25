import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { DynamoDbConfig } from '../config/app-config';
import { createDocumentClient, createDynamoDbClient } from './dynamodb-clients';

const tables = { users: 'users', products: 'products' };

describe('createDynamoDbClient', () => {
  it('uses the AWS endpoint and credentials when no local endpoint is set', async () => {
    const config: DynamoDbConfig = { region: 'sa-east-1', localEndpoint: undefined, tables };

    const client = createDynamoDbClient(config);

    await expect(client.config.region()).resolves.toBe('sa-east-1');
    expect(client.config.isCustomEndpoint).toBe(false);
  });

  it('uses placeholder credentials with a local endpoint', async () => {
    const config: DynamoDbConfig = {
      region: 'us-east-1',
      localEndpoint: 'http://localhost:8000',
      tables,
    };

    const client = createDynamoDbClient(config);

    expect(client.config.isCustomEndpoint).toBe(true);
    await expect(client.config.credentials()).resolves.toEqual(
      expect.objectContaining({ accessKeyId: 'local', secretAccessKey: 'local' }),
    );
  });
});

describe('createDocumentClient', () => {
  it('removes undefined attributes from the items it writes', () => {
    const client = new DynamoDBClient({ region: 'us-east-1' });

    const documentClient = createDocumentClient(client);

    expect(documentClient).toBeInstanceOf(DynamoDBDocumentClient);
    expect(documentClient.config.translateConfig?.marshallOptions?.removeUndefinedValues).toBe(
      true,
    );
  });
});
