import { userIdSchema } from './user';

describe('userIdSchema', () => {
  it('accepts a UUID', () => {
    expect(userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f')).toBe(
      '7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f',
    );
  });

  it.each(['', 'user-1', '7d0f5c1e3b2a4c8d9e6f1a2b3c4d5e6f'])('rejects %p', (value) => {
    expect(userIdSchema.safeParse(value).success).toBe(false);
  });
});
