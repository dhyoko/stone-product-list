import { Logger } from '@nestjs/common';
import { loadConfig, loadEnvFile } from '../config/load-config';
import { createTables } from '../database/create-tables';
import { createDynamoDbClient } from '../database/dynamodb-clients';
import { buildTableDefinitions } from '../database/tables';

const logger = new Logger('CreateTables');

async function main(): Promise<void> {
  loadEnvFile('.env', process.env);
  const config = loadConfig(process.env);
  const client = createDynamoDbClient(config.dynamoDb);
  try {
    const results = await createTables(client, buildTableDefinitions(config.dynamoDb.tables));
    for (const { tableName, outcome } of results) {
      logger.log(`${tableName}: ${outcome}`);
    }
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error('Could not create the tables', error);
  process.exit(1);
});
