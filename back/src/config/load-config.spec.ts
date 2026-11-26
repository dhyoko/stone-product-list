import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfig } from './app-config';
import { InvalidConfigError } from './invalid-config.error';
import { loadConfig, loadEnvFile } from './load-config';

const REQUIRED = { JWT_SECRET: 'a-secret-that-is-at-least-32-characters' };

describe('loadConfig', () => {
  it('uses the defaults when no variables are set', () => {
    const config = loadConfig(REQUIRED);

    expect(config).toBeInstanceOf(AppConfig);
    expect(config.nodeEnv).toBe('development');
    expect(config.http.port).toBe(3000);
    expect(config.dynamoDb).toEqual({
      region: 'us-east-1',
      localEndpoint: undefined,
      tables: { users: 'product-api-users', products: 'product-api-products' },
    });
  });

  it('reads the values that are set', () => {
    const config = loadConfig({ ...REQUIRED, NODE_ENV: 'production', PORT: '8080' });

    expect(config.nodeEnv).toBe('production');
    expect(config.http.port).toBe(8080);
  });

  it('reads the DynamoDB values that are set', () => {
    const config = loadConfig({
      ...REQUIRED,
      AWS_REGION: 'sa-east-1',
      DYNAMODB_LOCAL_ENDPOINT: 'http://localhost:8000',
      USERS_TABLE: 'dev-users',
      PRODUCTS_TABLE: 'dev-products',
    });

    expect(config.dynamoDb).toEqual({
      region: 'sa-east-1',
      localEndpoint: 'http://localhost:8000',
      tables: { users: 'dev-users', products: 'dev-products' },
    });
  });

  it('ignores variables that the schema does not define', () => {
    const config = loadConfig({ ...REQUIRED, HOME: '/home/user' });

    expect(config).not.toHaveProperty('HOME');
  });

  it.each([
    ['not a number', 'abc'],
    ['zero', '0'],
    ['above 65535', '70000'],
    ['a decimal', '3000.5'],
  ])('rejects a PORT that is %s', (_case, port) => {
    expect(() => loadConfig({ ...REQUIRED, PORT: port })).toThrow(InvalidConfigError);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadConfig({ ...REQUIRED, NODE_ENV: 'staging' })).toThrow(InvalidConfigError);
  });

  it('rejects a DYNAMODB_LOCAL_ENDPOINT that is not a URL', () => {
    expect(() => loadConfig({ ...REQUIRED, DYNAMODB_LOCAL_ENDPOINT: 'localhost' })).toThrow(
      InvalidConfigError,
    );
  });

  it.each([
    ['too short', 'ab'],
    ['has a space', 'my users'],
    ['has a slash', 'users/v2'],
  ])('rejects a table name that is %s', (_case, name) => {
    expect(() => loadConfig({ ...REQUIRED, USERS_TABLE: name })).toThrow(InvalidConfigError);
  });

  it('defaults the Redis URL to the local Redis and prefixes keys with the app name', () => {
    expect(loadConfig(REQUIRED).redis).toEqual({
      url: 'redis://localhost:6379',
      keyPrefix: 'product-api:',
    });
  });

  it.each(['', 'e2e-1a2b3c4d:'])('reads a REDIS_KEY_PREFIX of %p', (prefix) => {
    expect(loadConfig({ ...REQUIRED, REDIS_KEY_PREFIX: prefix }).redis.keyPrefix).toBe(prefix);
  });

  it.each(['has space', 'a'.repeat(65)])('rejects a REDIS_KEY_PREFIX of %p', (prefix) => {
    expect(() => loadConfig({ ...REQUIRED, REDIS_KEY_PREFIX: prefix })).toThrow(InvalidConfigError);
  });

  it.each(['redis://cache:6379', 'rediss://user:pass@cache.example.com:6380/0'])(
    'reads a REDIS_URL of %p',
    (url) => {
      expect(loadConfig({ ...REQUIRED, REDIS_URL: url }).redis.url).toBe(url);
    },
  );

  it.each(['localhost:6379', 'http://localhost:6379'])('rejects a REDIS_URL of %p', (url) => {
    expect(() => loadConfig({ ...REQUIRED, REDIS_URL: url })).toThrow(InvalidConfigError);
  });

  it('defaults the rate limits to 60 a minute per user and 5 a minute per IP', () => {
    expect(loadConfig(REQUIRED).rateLimit).toEqual({ windowSeconds: 60, perUser: 60, perIp: 5 });
  });

  it('reads the rate limit values that are set', () => {
    const config = loadConfig({
      ...REQUIRED,
      RATE_LIMIT_WINDOW_SECONDS: '10',
      RATE_LIMIT_PER_USER: '100',
      RATE_LIMIT_PER_IP: '3',
    });

    expect(config.rateLimit).toEqual({ windowSeconds: 10, perUser: 100, perIp: 3 });
  });

  it.each([
    ['RATE_LIMIT_WINDOW_SECONDS', '0'],
    ['RATE_LIMIT_WINDOW_SECONDS', '3601'],
    ['RATE_LIMIT_PER_USER', '0'],
    ['RATE_LIMIT_PER_IP', '1.5'],
    ['RATE_LIMIT_PER_IP', '10001'],
  ])('rejects a %s of %p', (name, value) => {
    expect(() => loadConfig({ ...REQUIRED, [name]: value })).toThrow(InvalidConfigError);
  });

  it('reads the auth values and defaults the token lifetime to 15 minutes', () => {
    expect(loadConfig(REQUIRED).auth).toEqual({
      jwtSecret: REQUIRED.JWT_SECRET,
      accessTokenTtlSeconds: 900,
    });
    expect(
      loadConfig({ ...REQUIRED, ACCESS_TOKEN_TTL_SECONDS: '60' }).auth.accessTokenTtlSeconds,
    ).toBe(60);
  });

  it('rejects a missing JWT_SECRET', () => {
    expect(() => loadConfig({})).toThrow(/JWT_SECRET/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => loadConfig({ JWT_SECRET: 'short-secret' })).toThrow(InvalidConfigError);
  });

  it.each(['59', '86401', 'abc'])('rejects an ACCESS_TOKEN_TTL_SECONDS of %p', (ttl) => {
    expect(() => loadConfig({ ...REQUIRED, ACCESS_TOKEN_TTL_SECONDS: ttl })).toThrow(
      InvalidConfigError,
    );
  });

  it('names every invalid variable in the error message', () => {
    const load = (): AppConfig => loadConfig({ ...REQUIRED, NODE_ENV: 'staging', PORT: 'abc' });

    expect(load).toThrow(/NODE_ENV/);
    expect(load).toThrow(/PORT/);
  });
});

describe('loadEnvFile', () => {
  let directory: string;
  let path: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'load-env-file-'));
    path = join(directory, '.env');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('copies the variables from the file', () => {
    writeFileSync(path, 'PORT=4000\nNODE_ENV=test\n');
    const target: NodeJS.ProcessEnv = {};

    loadEnvFile(path, target);

    expect(target).toEqual({ PORT: '4000', NODE_ENV: 'test' });
  });

  it('keeps a variable that the target already has', () => {
    writeFileSync(path, 'PORT=4000\n');
    const target: NodeJS.ProcessEnv = { PORT: '5000' };

    loadEnvFile(path, target);

    expect(target.PORT).toBe('5000');
  });

  it('leaves the target unchanged when the file does not exist', () => {
    const target: NodeJS.ProcessEnv = { PORT: '5000' };

    loadEnvFile(join(directory, 'missing.env'), target);

    expect(target).toEqual({ PORT: '5000' });
  });
});
