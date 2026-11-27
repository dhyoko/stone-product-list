import { z } from 'zod';
import { productIdSchema, type ProductPosition } from './product';
import { InvalidCursorError } from './invalid-cursor.error';

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

const cursorSchema = z.strictObject({
  id: productIdSchema,
  createdAt: z.iso.datetime().transform((value) => new Date(value)),
});

export function encodeCursor({ id, createdAt }: ProductPosition): string {
  const json = JSON.stringify({ id, createdAt: createdAt.toISOString() });
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): ProductPosition {
  if (!BASE64URL_PATTERN.test(cursor)) {
    throw new InvalidCursorError({ cause: new Error('The cursor is not base64url') });
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch (error) {
    throw new InvalidCursorError({ cause: error });
  }
  const result = cursorSchema.safeParse(decoded);
  if (!result.success) {
    throw new InvalidCursorError({ cause: result.error });
  }
  return result.data;
}
