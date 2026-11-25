import { buildDemoProducts } from './demo-products';
import { productIdSchema } from './product';

describe('buildDemoProducts', () => {
  const products = buildDemoProducts();

  it('builds 50 products', () => {
    expect(products).toHaveLength(50);
  });

  it('gives each product a unique UUID', () => {
    for (const { id } of products) {
      expect(productIdSchema.safeParse(id).success).toBe(true);
    }
    expect(new Set(products.map(({ id }) => id)).size).toBe(50);
  });

  it('builds the same products on every call', () => {
    expect(buildDemoProducts()).toEqual(products);
  });

  it('gives each product a distinct creation time', () => {
    expect(new Set(products.map(({ createdAt }) => createdAt.getTime())).size).toBe(50);
  });

  it('prices every product as a positive whole number of cents in BRL', () => {
    for (const { priceInCents, currency } of products) {
      expect(Number.isInteger(priceInCents)).toBe(true);
      expect(priceInCents).toBeGreaterThan(0);
      expect(currency).toBe('BRL');
    }
  });
});
