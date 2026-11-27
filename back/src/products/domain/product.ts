import { z } from 'zod';

export const productIdSchema = z.uuid().brand<'ProductId'>();

export type ProductId = z.infer<typeof productIdSchema>;

export interface Product {
  readonly id: ProductId;
  readonly name: string;
  readonly description: string;
  readonly priceInCents: number;
  readonly currency: string;
  readonly createdAt: Date;
}

export type ProductPosition = Pick<Product, 'id' | 'createdAt'>;

export interface ProductSlice {
  readonly items: readonly Product[];
  readonly hasMore: boolean;
}
