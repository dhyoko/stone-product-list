import { ThrottlerStorageService } from '@nestjs/throttler';
import { createRateLimitOptions } from './rate-limit-options';

const config = { windowSeconds: 30, perUser: 60, perIp: 5 };

describe('createRateLimitOptions', () => {
  it('sets the window in milliseconds', () => {
    const options = createRateLimitOptions({ config });

    expect(options).toMatchObject({ throttlers: [{ name: 'default', ttl: 30_000 }] });
  });

  it('uses the storage it is given', () => {
    const storage = new ThrottlerStorageService();

    expect(createRateLimitOptions({ config, storage })).toMatchObject({ storage });
  });

  it('leaves the storage unset when none is given', () => {
    expect(createRateLimitOptions({ config })).not.toHaveProperty('storage');
  });
});
