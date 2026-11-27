import type { Product, ProductPosition, ProductSlice } from '../domain/product';
import { ProductAlreadyExistsError } from '../domain/product-already-exists.error';
import { ProductsRepository } from '../application/products.repository';

function sortKeyOf({ id, createdAt }: ProductPosition): string {
  return `${createdAt.toISOString()}#${id}`;
}

export class InMemoryProductsRepository extends ProductsRepository {
  readonly products = new Map<string, Product>();

  listNewestFirst({
    limit,
    after,
  }: {
    readonly limit: number;
    readonly after?: ProductPosition;
  }): Promise<ProductSlice> {
    const sorted = [...this.products.values()].sort((a, b) =>
      sortKeyOf(b).localeCompare(sortKeyOf(a)),
    );
    const start =
      after === undefined ? sorted : sorted.filter((p) => sortKeyOf(p) < sortKeyOf(after));
    return Promise.resolve({ items: start.slice(0, limit), hasMore: start.length > limit });
  }

  create(product: Product): Promise<void> {
    if (this.products.has(product.id)) {
      return Promise.reject(new ProductAlreadyExistsError({ cause: new Error('Id is taken') }));
    }
    this.products.set(product.id, product);
    return Promise.resolve();
  }
}
