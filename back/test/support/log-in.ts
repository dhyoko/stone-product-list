import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number(),
});

export async function logIn(
  app: INestApplication<App>,
  { email, password }: { readonly email: string; readonly password: string },
): Promise<string> {
  const response = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
  return loginResponseSchema.parse(response.body).accessToken;
}
