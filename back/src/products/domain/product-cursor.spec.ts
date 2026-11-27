import { InvalidCursorError } from './invalid-cursor.error';
import { productIdSchema } from './product';
import { decodeCursor, encodeCursor } from './product-cursor';

const position = {
  id: productIdSchema.parse('2b1e4c7a-8d3f-4a6b-9c2e-5f7a1b3c4d5e'),
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
};

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('product cursor', () => {
  it('decodes the position that it encoded', () => {
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it('encodes to a base64url string with no padding', () => {
    expect(encodeCursor(position)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['an empty string', ''],
    ['a string with characters outside base64url', 'abc+/=='],
    ['base64url that is not JSON', Buffer.from('not json').toString('base64url')],
    ['JSON that is not an object', encodeJson(42)],
    ['an object without an id', encodeJson({ createdAt: '2026-11-20T10:00:00.000Z' })],
    ['an id that is not a UUID', encodeJson({ id: 'p1', createdAt: '2026-11-20T10:00:00.000Z' })],
    ['a date that is not ISO 8601', encodeJson({ id: position.id, createdAt: 'yesterday' })],
    [
      'an object with extra fields',
      encodeJson({ id: position.id, createdAt: '2026-11-20T10:00:00.000Z', listKey: 'USER' }),
    ],
  ])('rejects %s', (_case, cursor) => {
    expect(() => decodeCursor(cursor)).toThrow(InvalidCursorError);
  });

  it('reports a bad cursor as invalid input with a stable code', () => {
    const error = captureError(() => decodeCursor('not-a-cursor'));

    expect(error).toBeInstanceOf(InvalidCursorError);
    expect(error).toMatchObject({ code: 'PRODUCTS_INVALID_CURSOR', category: 'invalid_input' });
  });
});
