import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { createDocumentClient, createDynamoDbClient } from './dynamodb-clients';

@Global()
@Module({
  providers: [
    {
      provide: DynamoDBClient,
      inject: [AppConfig],
      useFactory: (config: AppConfig): DynamoDBClient => createDynamoDbClient(config.dynamoDb),
    },
    {
      provide: DynamoDBDocumentClient,
      inject: [DynamoDBClient],
      useFactory: createDocumentClient,
    },
  ],
  exports: [DynamoDBDocumentClient],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(private readonly client: DynamoDBClient) {}

  onApplicationShutdown(): void {
    this.client.destroy();
  }
}
