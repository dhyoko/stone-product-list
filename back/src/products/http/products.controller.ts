import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/errors/error-response.dto';
import { ApiRateLimitedResponse } from '../../rate-limit/api-rate-limited-response.decorator';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductPageResponseDto } from './dto/product-page-response.dto';
import { ProductsService } from '../application/products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products, newest first, one page at a time' })
  @ApiOkResponse({ type: ProductPageResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'The limit is out of range, or the cursor is not valid',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'The access token is missing, expired, or not valid',
  })
  @ApiRateLimitedResponse()
  async list(@Query() query: ListProductsQueryDto): Promise<ProductPageResponseDto> {
    return new ProductPageResponseDto(
      await this.productsService.list({ limit: query.limit, cursor: query.cursor }),
    );
  }
}
