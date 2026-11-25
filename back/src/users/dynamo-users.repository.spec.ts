import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Test } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { ZodError } from 'zod';
import { AppConfig } from '../config/app-config';
import { buildTestConfig } from '../config/testing/test-config';
import { type StoredUser, userIdSchema } from './user';
import { UserAlreadyExistsError } from './user-already-exists.error';
import { DynamoUsersRepository } from './dynamo-users.repository';

const user: StoredUser = {
  id: userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f'),
  email: 'ana@example.com',
  name: 'Ana',
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA',
};

describe('DynamoUsersRepository', () => {
  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
  const dynamoDb = mockClient(documentClient);
  const config = buildTestConfig({ USERS_TABLE: 'test-users' });

  let repository: DynamoUsersRepository;

  beforeEach(async () => {
    dynamoDb.reset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DynamoUsersRepository,
        { provide: DynamoDBDocumentClient, useValue: documentClient },
        { provide: AppConfig, useValue: config },
      ],
    }).compile();

    repository = moduleRef.get(DynamoUsersRepository);
  });

  describe('findByEmail', () => {
    it('reads the user by email from the users table', async () => {
      dynamoDb.on(GetCommand).resolves({ Item: { ...user } });

      await expect(repository.findByEmail('ana@example.com')).resolves.toEqual(user);
      expect(dynamoDb.commandCalls(GetCommand)[0]?.args[0].input).toEqual({
        TableName: 'test-users',
        Key: { email: 'ana@example.com' },
      });
    });

    it('returns undefined when no user has the email', async () => {
      dynamoDb.on(GetCommand).resolves({});

      await expect(repository.findByEmail('nobody@example.com')).resolves.toBeUndefined();
    });

    it('drops attributes that the user type does not define', async () => {
      dynamoDb.on(GetCommand).resolves({ Item: { ...user, legacyRole: 'admin' } });

      await expect(repository.findByEmail('ana@example.com')).resolves.toEqual(user);
    });

    it('rejects an item with an id that is not a UUID', async () => {
      dynamoDb.on(GetCommand).resolves({ Item: { ...user, id: 'user-1' } });

      await expect(repository.findByEmail('ana@example.com')).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('findById', () => {
    it('queries the byId index for one user', async () => {
      dynamoDb.on(QueryCommand).resolves({ Items: [{ ...user }] });

      await expect(repository.findById(user.id)).resolves.toEqual(user);
      expect(dynamoDb.commandCalls(QueryCommand)[0]?.args[0].input).toEqual({
        TableName: 'test-users',
        IndexName: 'byId',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': user.id },
        Limit: 1,
      });
    });

    it.each([
      ['an empty list', { Items: [] }],
      ['no list', {}],
    ])('returns undefined when the query returns %s', async (_case, output) => {
      dynamoDb.on(QueryCommand).resolves(output);

      await expect(repository.findById(user.id)).resolves.toBeUndefined();
    });
  });

  describe('create', () => {
    it('writes the user only when the email is not taken', async () => {
      dynamoDb.on(PutCommand).resolves({});

      await repository.create(user);

      expect(dynamoDb.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
        TableName: 'test-users',
        Item: user,
        ConditionExpression: 'attribute_not_exists(email)',
      });
    });

    it('throws UserAlreadyExistsError when the email is taken', async () => {
      const conflict = new ConditionalCheckFailedException({
        message: 'The conditional request failed',
        $metadata: {},
      });
      dynamoDb.on(PutCommand).rejects(conflict);

      const result = repository.create(user);

      await expect(result).rejects.toBeInstanceOf(UserAlreadyExistsError);
      await expect(result).rejects.toMatchObject({ code: 'USER_ALREADY_EXISTS', cause: conflict });
    });

    it('rethrows any other error', async () => {
      const error = new Error('Network is unreachable');
      dynamoDb.on(PutCommand).rejects(error);

      await expect(repository.create(user)).rejects.toBe(error);
    });
  });
});
