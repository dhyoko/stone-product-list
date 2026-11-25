import { ApiProperty } from '@nestjs/swagger';
import type { Product } from '../product';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid', example: '2b1e4c7a-8d3f-4a6b-9c2e-5f7a1b3c4d5e' })
  readonly id: string;

  @ApiProperty({ example: 'Ceramic mug' })
  readonly name: string;

  @ApiProperty({ example: 'A ceramic mug for everyday use.' })
  readonly description: string;

  @ApiProperty({ description: 'Price in cents of the currency', example: 4990 })
  readonly priceInCents: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'BRL' })
  readonly currency: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-20T10:00:00.000Z' })
  readonly createdAt: string;

  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.priceInCents = product.priceInCents;
    this.currency = product.currency;
    this.createdAt = product.createdAt.toISOString();
  }
}
