import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { DynamoDbConfig } from '../config/app-config';

const LOCAL_CREDENTIALS = { accessKeyId: 'local', secretAccessKey: 'local' };

export function createDynamoDbClient(config: DynamoDbConfig): DynamoDBClient {
  if (config.localEndpoint === undefined) {
    return new DynamoDBClient({ region: config.region });
  }
  return new DynamoDBClient({
    region: config.region,
    endpoint: config.localEndpoint,
    credentials: LOCAL_CREDENTIALS,
  });
}

export function createDocumentClient(client: DynamoDBClient): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}
