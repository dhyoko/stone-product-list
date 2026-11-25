import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  testEnvironment: 'node',
  testRegex: '\\.e2e-spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  clearMocks: true,
  restoreMocks: true,
};

export default config;
