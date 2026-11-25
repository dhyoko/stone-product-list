import type { AppConfig } from '../app-config';
import { loadConfig } from '../load-config';

export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

export function buildTestConfig(env: Readonly<Record<string, string>> = {}): AppConfig {
  return loadConfig({ NODE_ENV: 'test', JWT_SECRET: TEST_JWT_SECRET, ...env });
}
