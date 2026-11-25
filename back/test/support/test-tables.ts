import { DeleteTableCommand, type DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { AppConfig } from '../../src/config/app-config';
import { createTables } from '../../src/database/create-tables';
import { buildTableDefinitions } from '../../src/database/tables';

export async function createTestTables(client: DynamoDBClient, config: AppConfig): Promise<void> {
  await createTables(client, buildTableDefinitions(config.dynamoDb.tables));
}

export async function deleteTestTables(client: DynamoDBClient, config: AppConfig): Promise<void> {
  const { users, products } = config.dynamoDb.tables;
  await Promise.all(
    [users, products].map((TableName) => client.send(new DeleteTableCommand({ TableName }))),
  );
}
