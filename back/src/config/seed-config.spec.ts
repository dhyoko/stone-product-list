import { InvalidConfigError } from './invalid-config.error';
import { loadSeedConfig } from './seed-config';

describe('loadSeedConfig', () => {
  it('reads the demo user password', () => {
    expect(loadSeedConfig({ SEED_USER_PASSWORD: 'demo-password' })).toEqual({
      userPassword: 'demo-password',
    });
  });

  it('rejects a missing password', () => {
    expect(() => loadSeedConfig({})).toThrow(InvalidConfigError);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(() => loadSeedConfig({ SEED_USER_PASSWORD: 'short' })).toThrow(/SEED_USER_PASSWORD/);
  });
});
