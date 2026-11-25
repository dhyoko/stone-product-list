import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('hashes with argon2id and never returns the password', async () => {
    const hash = await hasher.hash('correct horse');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('correct horse');
  });

  it('salts each hash', async () => {
    const [first, second] = await Promise.all([hasher.hash('same'), hasher.hash('same')]);

    expect(first).not.toBe(second);
  });

  it('accepts the password that made the hash', async () => {
    const hash = await hasher.hash('correct horse');

    await expect(hasher.verify({ hash, password: 'correct horse' })).resolves.toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hasher.hash('correct horse');

    await expect(hasher.verify({ hash, password: 'wrong horse' })).resolves.toBe(false);
  });
});
