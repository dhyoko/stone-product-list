import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AppConfig } from '../../config/app-config';
import { USERS_BY_ID_INDEX } from '../../database/tables';
import { type StoredUser, type UserId, userIdSchema } from '../domain/user';
import { UserAlreadyExistsError } from '../domain/user-already-exists.error';
import { UsersRepository } from '../application/users.repository';

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

  async findById(id: UserId): Promise<StoredUser | undefined> {
    const { Items = [] } = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: USERS_BY_ID_INDEX,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': id },
        Limit: 1,
      }),
    );
    const [item] = Items;
    return item === undefined ? undefined : userItemSchema.parse(item);
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
