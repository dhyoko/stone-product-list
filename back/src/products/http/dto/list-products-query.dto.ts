import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of products per page',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  readonly limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'The nextCursor value from the previous page. Leave it out for the first page.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly cursor?: string;
}
