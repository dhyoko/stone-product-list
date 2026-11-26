import type { Product, ProductPosition, ProductSlice } from './product';

export abstract class ProductsRepository {
  abstract listNewestFirst(input: {
    readonly limit: number;
    readonly after?: ProductPosition;
  }): Promise<ProductSlice>;

  abstract create(product: Product): Promise<void>;
}
