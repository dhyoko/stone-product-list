import { Module } from '@nestjs/common';
import { DynamoProductsRepository } from './infrastructure/dynamo-products.repository';
import { ProductsController } from './http/products.controller';
import { ProductsRepository } from './application/products.repository';
import { ProductsService } from './application/products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, { provide: ProductsRepository, useClass: DynamoProductsRepository }],
})
export class ProductsModule {}
