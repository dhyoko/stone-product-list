import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { AppConfig } from '../src/config/app-config';
import { createLambdaApp, type LambdaApp } from '../src/lambda';
import { createTestTables, deleteTestTables } from './support/test-tables';

function apiGatewayEvent(input: {
  readonly method: string;
  readonly path: string;
  readonly sourceIp: string;
  readonly body?: unknown;
}): APIGatewayProxyEvent {
  const body = input.body === undefined ? null : JSON.stringify(input.body);
  return {
    httpMethod: input.method,
    path: input.path,
    resource: '/{proxy+}',
    body,
    isBase64Encoded: false,
    headers: body === null ? {} : { 'content-type': 'application/json' },
    multiValueHeaders: body === null ? {} : { 'content-type': ['application/json'] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { proxy: input.path.slice(1) },
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'local',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: input.method,
      path: `/v1${input.path}`,
      stage: 'v1',
      requestId: 'request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'resource-id',
      resourcePath: '/{proxy+}',
      identity: {
        sourceIp: input.sourceIp,
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        user: null,
        userAgent: 'e2e',
        userArn: null,
      },
    },
  };
}

const context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'product-api',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:product-api',
  memoryLimitInMB: '512',
  awsRequestId: 'request-id',
  logGroupName: '/aws/lambda/product-api',
  logStreamName: 'stream',
  getRemainingTimeInMillis: () => 10_000,
  done: () => undefined,
  fail: () => undefined,
  succeed: () => undefined,
};
const LOGIN = { email: 'nobody@example.com', password: 'wrong-password' };

describe('Lambda handler (e2e)', () => {
  let lambda: LambdaApp;
  let client: DynamoDBClient;
  let config: AppConfig;

  beforeAll(async () => {
    process.env.RATE_LIMIT_PER_IP = '1';
    lambda = await createLambdaApp();
    config = lambda.app.get(AppConfig);
    client = lambda.app.get(DynamoDBClient);
    await createTestTables(client, config);
  });

  afterAll(async () => {
    await deleteTestTables(client, config);
    await lambda.app.close();
  });

  it('serves an API Gateway request', async () => {
    const response = await lambda.handler(
      apiGatewayEvent({ method: 'GET', path: '/health', sourceIp: '203.0.113.10' }),
      context,
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
  });

  it('returns the error body for a protected route without a token', async () => {
    const response = await lambda.handler(
      apiGatewayEvent({ method: 'GET', path: '/products', sourceIp: '203.0.113.10' }),
      context,
    );

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toMatchObject({ code: 'AUTH_INVALID_TOKEN' });
  });

  it('counts requests by the API Gateway source IP', async () => {
    const login = (sourceIp: string): Promise<{ statusCode: number }> =>
      lambda.handler(
        apiGatewayEvent({ method: 'POST', path: '/auth/login', sourceIp, body: LOGIN }),
        context,
      );

    const first = await login('198.51.100.1');
    const otherIp = await login('198.51.100.2');
    const sameIpAgain = await login('198.51.100.1');

    expect([first.statusCode, otherIp.statusCode, sameIpAgain.statusCode]).toEqual([401, 401, 429]);
  });
});
