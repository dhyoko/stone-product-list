import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { buildDemoProducts } from './demo-products';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  const productsService = { list: jest.fn() };
  const [product] = buildDemoProducts();

  let controller: ProductsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = moduleRef.get(ProductsController);
  });

  it('passes the limit and the cursor to the service', async () => {
    productsService.list.mockResolvedValue({ items: [], nextCursor: null });

    await controller.list(plainToInstance(ListProductsQueryDto, { limit: '5', cursor: 'abc' }));

    expect(productsService.list).toHaveBeenCalledWith({ limit: 5, cursor: 'abc' });
  });

  it('maps each product to the response shape with an ISO creation time', async () => {
    productsService.list.mockResolvedValue({ items: [product], nextCursor: 'next' });

    const response = await controller.list(plainToInstance(ListProductsQueryDto, {}));

    expect(response).toEqual({
      items: [
        {
          id: product?.id,
          name: product?.name,
          description: product?.description,
          priceInCents: product?.priceInCents,
          currency: 'BRL',
          createdAt: product?.createdAt.toISOString(),
        },
      ],
      nextCursor: 'next',
    });
  });
});
