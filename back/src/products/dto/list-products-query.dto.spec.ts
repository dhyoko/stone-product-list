import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListProductsQueryDto } from './list-products-query.dto';

async function parse(query: object): Promise<{
  readonly dto: ListProductsQueryDto;
  readonly invalid: readonly string[];
}> {
  const dto = plainToInstance(ListProductsQueryDto, query);
  const errors = await validate(dto);
  return { dto, invalid: errors.map(({ property }) => property) };
}

describe('ListProductsQueryDto', () => {
  it('defaults the limit to 20 and leaves the cursor out', async () => {
    const { dto, invalid } = await parse({});

    expect(invalid).toEqual([]);
    expect(dto.limit).toBe(20);
    expect(dto.cursor).toBeUndefined();
  });

  it.each(['1', '100'])('accepts a limit of %s from the query string', async (limit) => {
    const { dto, invalid } = await parse({ limit });

    expect(invalid).toEqual([]);
    expect(dto.limit).toBe(Number(limit));
  });

  it.each(['0', '101', '2.5', 'ten'])('rejects a limit of %p', async (limit) => {
    await expect(parse({ limit })).resolves.toMatchObject({ invalid: ['limit'] });
  });

  it.each([
    ['an empty cursor', ''],
    ['a cursor over 512 characters', 'a'.repeat(513)],
  ])('rejects %s', async (_case, cursor) => {
    await expect(parse({ cursor })).resolves.toMatchObject({ invalid: ['cursor'] });
  });
});
