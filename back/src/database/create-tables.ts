import {
  CreateTableCommand,
  type DynamoDBClient,
  ResourceInUseException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import type { TableDefinition } from './tables';

export type TableOutcome = 'created' | 'already_exists';

export interface TableResult {
  readonly tableName: string;
  readonly outcome: TableOutcome;
}

const MAX_WAIT_SECONDS = 60;

export async function createTables(
  client: DynamoDBClient,
  definitions: readonly TableDefinition[],
): Promise<readonly TableResult[]> {
  const results: TableResult[] = [];
  for (const definition of definitions) {
    results.push({
      tableName: definition.TableName,
      outcome: await createTable(client, definition),
    });
  }
  return results;
}

async function createTable(
  client: DynamoDBClient,
  definition: TableDefinition,
): Promise<TableOutcome> {
  try {
    await client.send(new CreateTableCommand(definition));
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      return 'already_exists';
    }
    throw error;
  }
  await waitUntilTableExists(
    { client, maxWaitTime: MAX_WAIT_SECONDS },
    { TableName: definition.TableName },
  );
  return 'created';
}
