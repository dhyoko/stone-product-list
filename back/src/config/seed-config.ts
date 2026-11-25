import { z } from 'zod';
import { InvalidConfigError } from './invalid-config.error';

const seedEnvSchema = z.object({
  SEED_USER_PASSWORD: z.string().min(8),
});

export interface SeedConfig {
  readonly userPassword: string;
}

export function loadSeedConfig(source: Readonly<Record<string, string | undefined>>): SeedConfig {
  const result = seedEnvSchema.safeParse(source);
  if (!result.success) {
    throw new InvalidConfigError(
      `Invalid seed environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return { userPassword: result.data.SEED_USER_PASSWORD };
}
