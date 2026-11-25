import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfig } from './app-config';
import { InvalidConfigError } from './invalid-config.error';
import { loadConfig, loadEnvFile } from './load-config';

describe('loadConfig', () => {
  it('uses the defaults when no variables are set', () => {
    const config = loadConfig({});

    expect(config).toBeInstanceOf(AppConfig);
    expect(config.nodeEnv).toBe('development');
    expect(config.http.port).toBe(3000);
  });

  it('reads the values that are set', () => {
    const config = loadConfig({ NODE_ENV: 'production', PORT: '8080' });

    expect(config.nodeEnv).toBe('production');
    expect(config.http.port).toBe(8080);
  });

  it('ignores variables that the schema does not define', () => {
    const config = loadConfig({ HOME: '/home/user' });

    expect(config).not.toHaveProperty('HOME');
  });

  it.each([
    ['not a number', 'abc'],
    ['zero', '0'],
    ['above 65535', '70000'],
    ['a decimal', '3000.5'],
  ])('rejects a PORT that is %s', (_case, port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(InvalidConfigError);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(InvalidConfigError);
  });

  it('names every invalid variable in the error message', () => {
    const load = (): AppConfig => loadConfig({ NODE_ENV: 'staging', PORT: 'abc' });

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
