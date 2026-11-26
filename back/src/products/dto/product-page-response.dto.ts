import { ApiProperty } from '@nestjs/swagger';
import type { ProductPage } from '../products.service';
import { ProductResponseDto } from './product-response.dto';

export class ProductPageResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  readonly items: readonly ProductResponseDto[];

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Pass it as the cursor query parameter to get the next page. It is null on the last page.',
    example: 'eyJpZCI6IjJiMWU0YzdhLThkM2YtNGE2Yi05YzJlLTVmN2ExYjNjNGQ1ZSJ9',
  })
  readonly nextCursor: string | null;

  constructor(page: ProductPage) {
    this.items = page.items.map((product) => new ProductResponseDto(product));
    this.nextCursor = page.nextCursor;
  }
}
