import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { listProducts, type ProductPage } from '../api/products-api';
import { useAccessToken } from '../session/use-access-token';

export const PRODUCTS_PAGE_SIZE = 12;

const FIRST_PAGE_CURSOR: string | undefined = undefined;

export function useProducts(): UseInfiniteQueryResult<
  InfiniteData<ProductPage, string | undefined>
> {
  const accessToken = useAccessToken();
  return useInfiniteQuery({
    queryKey: ['products', PRODUCTS_PAGE_SIZE],
    queryFn: ({ pageParam, signal }) =>
      listProducts({ accessToken, limit: PRODUCTS_PAGE_SIZE, cursor: pageParam, signal }),
    initialPageParam: FIRST_PAGE_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
