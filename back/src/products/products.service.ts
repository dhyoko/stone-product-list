import { Injectable } from '@nestjs/common';
import type { Product } from './product';
import { decodeCursor, encodeCursor } from './product-cursor';
import { ProductsRepository } from './products.repository';

export interface ProductPage {
  readonly items: readonly Product[];
  readonly nextCursor: string | null;
}

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  async list(input: { readonly limit: number; readonly cursor?: string }): Promise<ProductPage> {
    const after = input.cursor === undefined ? undefined : decodeCursor(input.cursor);
    const { items, hasMore } = await this.repository.listNewestFirst({ limit: input.limit, after });
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last !== undefined ? encodeCursor(last) : null,
    };
  }
}
