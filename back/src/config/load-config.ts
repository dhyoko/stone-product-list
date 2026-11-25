import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { z } from 'zod';
import { AppConfig } from './app-config';
import { envSchema } from './env.schema';
import { InvalidConfigError } from './invalid-config.error';

type EnvSource = Readonly<Record<string, string | undefined>>;

/**
 * Parses environment variables into an `AppConfig`.
 * Throws `InvalidConfigError` that lists every invalid variable.
 */
export function loadConfig(source: EnvSource): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new InvalidConfigError(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return new AppConfig(result.data);
}

/**
 * Copies the variables from a `.env` file into `target` when the file exists.
 * A variable that `target` already has keeps its value.
 */
export function loadEnvFile(path: string, target: NodeJS.ProcessEnv): void {
  if (!existsSync(path)) {
    return;
  }
  const fileValues = parseEnv(readFileSync(path, 'utf8'));
  for (const [name, value] of Object.entries(fileValues)) {
    target[name] ??= value;
  }
}
