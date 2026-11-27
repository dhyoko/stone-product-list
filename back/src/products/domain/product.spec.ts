import { productIdSchema } from './product';

describe('productIdSchema', () => {
  it('accepts a UUID', () => {
    expect(productIdSchema.safeParse('2b1e4c7a-8d3f-4a6b-9c2e-5f7a1b3c4d5e').success).toBe(true);
  });

  it.each(['', 'product-1'])('rejects %p', (value) => {
    expect(productIdSchema.safeParse(value).success).toBe(false);
  });
});
