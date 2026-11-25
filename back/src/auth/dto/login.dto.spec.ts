import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

async function errorsFor(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(LoginDto, body));
  return errors.map(({ property }) => property);
}

describe('LoginDto', () => {
  it('accepts an email and a password', async () => {
    await expect(errorsFor({ email: 'ana@example.com', password: 'secret' })).resolves.toEqual([]);
  });

  it.each([
    ['a missing email', { password: 'secret' }, ['email']],
    ['an invalid email', { email: 'ana', password: 'secret' }, ['email']],
    ['a missing password', { email: 'ana@example.com' }, ['password']],
    ['an empty password', { email: 'ana@example.com', password: '' }, ['password']],
    [
      'a password over 128 characters',
      { email: 'ana@example.com', password: 'a'.repeat(129) },
      ['password'],
    ],
    [
      'a password that is not a string',
      { email: 'ana@example.com', password: 12345678 },
      ['password'],
    ],
  ])('rejects %s', async (_case, body, properties) => {
    await expect(errorsFor(body)).resolves.toEqual(properties);
  });
});
