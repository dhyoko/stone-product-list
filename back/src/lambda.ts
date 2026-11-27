import { SSMClient } from '@aws-sdk/client-ssm';
import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AppModule } from './app.module';
import { setupCors } from './common/http/setup-cors';
import { setupOpenApi } from './common/openapi/setup-openapi';
import { AppConfig } from './config/app-config';
import { loadJwtSecretFromSsm } from './config/ssm-secrets';

export type ApiGatewayHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;

export interface LambdaApp {
  readonly app: NestExpressApplication;
  readonly handler: ApiGatewayHandler;
}

export async function createLambdaApp(): Promise<LambdaApp> {
  await loadJwtSecretFromSsm({ env: process.env, client: new SSMClient({}) });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  setupCors(app, app.get(AppConfig).http.corsOrigins);
  setupOpenApi(app);
  await app.init();
  const serve = serverlessExpress<APIGatewayProxyEvent, APIGatewayProxyResult>({
    app: app.getHttpAdapter().getInstance(),
  });
  const handler: ApiGatewayHandler = async (event, context) => {
    const result = await serve(event, context, () => undefined);
    if (result === undefined) {
      throw new Error('serverless-express returned no response');
    }
    return result;
  };
  return { app, handler };
}

let lambdaApp: Promise<LambdaApp> | undefined;

export const handler: ApiGatewayHandler = async (event, context) => {
  lambdaApp ??= createLambdaApp().catch((error: unknown) => {
    lambdaApp = undefined;
    throw error;
  });
  const { handler: serve } = await lambdaApp;
  return serve(event, context);
};
