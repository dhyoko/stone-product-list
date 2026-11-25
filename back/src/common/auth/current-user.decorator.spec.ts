import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { userIdSchema } from '../../users/user';
import { readCurrentUser } from './current-user.decorator';

describe('readCurrentUser', () => {
  it('returns the user that the guard put on the request', () => {
    const user = { id: userIdSchema.parse('7d0f5c1e-3b2a-4c8d-9e6f-1a2b3c4d5e6f') };

    expect(readCurrentUser(undefined, new ExecutionContextHost([{ user }]))).toBe(user);
  });

  it('throws when the route has no authenticated user', () => {
    expect(() => readCurrentUser(undefined, new ExecutionContextHost([{}]))).toThrow(/JWT guard/);
  });
});
