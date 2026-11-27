import { Logger } from '@nestjs/common';
import { loadConfig, loadEnvFile } from '../config/load-config';
import { loadSeedConfig } from '../config/seed-config';
import { createDocumentClient, createDynamoDbClient } from '../database/dynamodb-clients';
import { buildDemoProducts } from '../products/seed/demo-products';
import { DynamoProductsRepository } from '../products/infrastructure/dynamo-products.repository';
import { seedProducts } from '../products/seed/seed-products';
import { Argon2PasswordHasher } from '../users/infrastructure/argon2-password-hasher';
import { DynamoUsersRepository } from '../users/infrastructure/dynamo-users.repository';
import { seedUsers } from '../users/seed/seed-users';

const logger = new Logger('Seed');

async function main(): Promise<void> {
  loadEnvFile('.env', process.env);
  const config = loadConfig(process.env);
  const seedConfig = loadSeedConfig(process.env);
  const client = createDynamoDbClient(config.dynamoDb);
  const documentClient = createDocumentClient(client);
  try {
    const results = await seedUsers({
      repository: new DynamoUsersRepository(documentClient, config),
      hasher: new Argon2PasswordHasher(),
      users: [{ email: 'demo@example.com', name: 'Demo User', password: seedConfig.userPassword }],
    });
    for (const { email, outcome } of results) {
      logger.log(`${email}: ${outcome}`);
    }
    const { created, alreadyExisting } = await seedProducts({
      repository: new DynamoProductsRepository(documentClient, config),
      products: buildDemoProducts(),
    });
    logger.log(`products: ${created} created, ${alreadyExisting} already existed`);
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error('Could not seed the database', error);
  process.exit(1);
});
