import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AppConfig } from '../config/app-config';
import { type StoredUser, userIdSchema } from './user';
import { UserAlreadyExistsError } from './user-already-exists.error';
import { UsersRepository } from './users.repository';

const userItemSchema = z.object({
  email: z.string(),
  id: userIdSchema,
  name: z.string(),
  passwordHash: z.string(),
});

type UserItem = z.infer<typeof userItemSchema>;

@Injectable()
export class DynamoUsersRepository extends UsersRepository {
  private readonly tableName: string;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    config: AppConfig,
  ) {
    super();
    this.tableName = config.dynamoDb.tables.users;
  }

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const { Item } = await this.client.send(
      new GetCommand({ TableName: this.tableName, Key: { email } }),
    );
    return Item === undefined ? undefined : userItemSchema.parse(Item);
  }

  async create(user: StoredUser): Promise<void> {
    const item = {
      email: user.email,
      id: user.id,
      name: user.name,
      passwordHash: user.passwordHash,
    } satisfies UserItem;
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(email)',
        }),
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new UserAlreadyExistsError({ cause: error });
      }
      throw error;
    }
  }
}
