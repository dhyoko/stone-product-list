import { z } from 'zod';
import { requestJson } from './http-client';

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().int(),
  currency: z.string(),
  createdAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

const productPageSchema = z.object({
  items: z.array(productSchema),
  nextCursor: z.string().nullable(),
});

export type ProductPage = z.infer<typeof productPageSchema>;

export function listProducts(input: {
  readonly accessToken: string;
  readonly limit: number;
  readonly cursor?: string;
  readonly signal?: AbortSignal;
}): Promise<ProductPage> {
  const query = new URLSearchParams({ limit: String(input.limit) });
  if (input.cursor !== undefined) {
    query.set('cursor', input.cursor);
  }
  return requestJson({
    path: `/products?${query.toString()}`,
    accessToken: input.accessToken,
    signal: input.signal,
    schema: productPageSchema,
  });
}
