import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CORS_EXPOSED_HEADERS, setupCors } from './setup-cors';

describe('setupCors', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication();
    jest.spyOn(app, 'enableCors');
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows only the listed origins and exposes the rate limit headers', () => {
    setupCors(app, ['http://localhost:5173']);

    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:5173'],
      exposedHeaders: CORS_EXPOSED_HEADERS,
      maxAge: 600,
    });
  });

  it('leaves CORS off when the list is empty', () => {
    setupCors(app, []);

    expect(app.enableCors).not.toHaveBeenCalled();
  });
});
