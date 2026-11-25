import { buildDemoProducts } from './demo-products';
import { seedProducts } from './seed-products';
import { InMemoryProductsRepository } from './testing/in-memory-products.repository';

describe('seedProducts', () => {
  const products = buildDemoProducts().slice(0, 3);

  let repository: InMemoryProductsRepository;

  beforeEach(() => {
    repository = new InMemoryProductsRepository();
  });

  it('creates every product', async () => {
    await expect(seedProducts({ repository, products })).resolves.toEqual({
      created: 3,
      alreadyExisting: 0,
    });
    expect([...repository.products.values()]).toEqual(products);
  });

  it('skips the products that already exist', async () => {
    await seedProducts({ repository, products: products.slice(0, 2) });

    await expect(seedProducts({ repository, products })).resolves.toEqual({
      created: 1,
      alreadyExisting: 2,
    });
  });

  it('rethrows any other error', async () => {
    const error = new Error('Network is unreachable');
    jest.spyOn(repository, 'create').mockRejectedValue(error);

    await expect(seedProducts({ repository, products })).rejects.toBe(error);
  });
});
