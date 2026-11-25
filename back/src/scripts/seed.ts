import { Logger } from '@nestjs/common';
import { loadConfig, loadEnvFile } from '../config/load-config';
import { loadSeedConfig } from '../config/seed-config';
import { createDocumentClient, createDynamoDbClient } from '../database/dynamodb-clients';
import { Argon2PasswordHasher } from '../users/argon2-password-hasher';
import { DynamoUsersRepository } from '../users/dynamo-users.repository';
import { seedUsers } from '../users/seed-users';

const logger = new Logger('Seed');

async function main(): Promise<void> {
  loadEnvFile('.env', process.env);
  const config = loadConfig(process.env);
  const seedConfig = loadSeedConfig(process.env);
  const client = createDynamoDbClient(config.dynamoDb);
  try {
    const results = await seedUsers({
      repository: new DynamoUsersRepository(createDocumentClient(client), config),
      hasher: new Argon2PasswordHasher(),
      users: [{ email: 'demo@example.com', name: 'Demo User', password: seedConfig.userPassword }],
    });
    for (const { email, outcome } of results) {
      logger.log(`${email}: ${outcome}`);
    }
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error('Could not seed the database', error);
  process.exit(1);
});
