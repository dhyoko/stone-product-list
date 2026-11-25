import type { Product } from './product';
import { ProductAlreadyExistsError } from './product-already-exists.error';
import type { ProductsRepository } from './products.repository';

export interface ProductSeedSummary {
  readonly created: number;
  readonly alreadyExisting: number;
}

export async function seedProducts(input: {
  readonly repository: ProductsRepository;
  readonly products: readonly Product[];
}): Promise<ProductSeedSummary> {
  let created = 0;
  let alreadyExisting = 0;
  for (const product of input.products) {
    try {
      await input.repository.create(product);
      created += 1;
    } catch (error) {
      if (!(error instanceof ProductAlreadyExistsError)) {
        throw error;
      }
      alreadyExisting += 1;
    }
  }
  return { created, alreadyExisting };
}
