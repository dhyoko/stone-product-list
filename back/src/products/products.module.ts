import { Module } from '@nestjs/common';
import { DynamoProductsRepository } from './dynamo-products.repository';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, { provide: ProductsRepository, useClass: DynamoProductsRepository }],
})
export class ProductsModule {}
