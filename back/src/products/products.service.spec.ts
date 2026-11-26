import { Test } from '@nestjs/testing';
import { buildDemoProducts } from './demo-products';
import { InvalidCursorError } from './invalid-cursor.error';
import type { Product } from './product';
import { decodeCursor } from './product-cursor';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { InMemoryProductsRepository } from './testing/in-memory-products.repository';

describe('ProductsService', () => {
  const products = buildDemoProducts().slice(0, 5);
  const newestFirst = [...products].reverse();

  let service: ProductsService;
  let repository: InMemoryProductsRepository;

  beforeEach(async () => {
    repository = new InMemoryProductsRepository();
    for (const product of products) {
      repository.products.set(product.id, product);
    }
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: ProductsRepository, useValue: repository }],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  describe('list', () => {
    it('returns the first page newest first with a cursor to the next page', async () => {
      const page = await service.list({ limit: 2 });

      expect(page.items).toEqual(newestFirst.slice(0, 2));
      expect(page.nextCursor).not.toBeNull();
      expect(decodeCursor(page.nextCursor ?? '')).toEqual({
        id: newestFirst[1]?.id,
        createdAt: newestFirst[1]?.createdAt,
      });
    });

    it('walks every product once across pages and ends with a null cursor', async () => {
      const seen: Product[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page += 1) {
        const result = await service.list({ limit: 2, cursor });
        seen.push(...result.items);
        if (result.nextCursor === null) {
          break;
        }
        cursor = result.nextCursor;
      }

      expect(seen).toEqual(newestFirst);
    });

    it('returns a null cursor when the last page is exactly full', async () => {
      await expect(service.list({ limit: 5 })).resolves.toMatchObject({ nextCursor: null });
    });

    it('returns a null cursor when a slice reports more but has no items', async () => {
      jest.spyOn(repository, 'listNewestFirst').mockResolvedValue({ items: [], hasMore: true });

      await expect(service.list({ limit: 5 })).resolves.toEqual({ items: [], nextCursor: null });
    });

    it('throws InvalidCursorError for a cursor that does not decode', async () => {
      await expect(service.list({ limit: 2, cursor: 'not-a-cursor' })).rejects.toBeInstanceOf(
        InvalidCursorError,
      );
    });
  });
});
