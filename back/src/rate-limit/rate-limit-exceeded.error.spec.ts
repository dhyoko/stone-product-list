import { RateLimitExceededError } from './rate-limit-exceeded.error';

describe('RateLimitExceededError', () => {
  it('has a stable code and the rate_limited category', () => {
    const error = new RateLimitExceededError();

    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.category).toBe('rate_limited');
    expect(error.message).toBe('Too many requests. Try again later.');
  });
});
