import { API_BASE_URL } from '../api/http-client';

const REPOSITORY_URL = 'https://github.com/dhyoko/stone-product-list';

export interface DocLink {
  readonly label: string;
  readonly href: string;
}

export const DOC_LINKS: readonly DocLink[] = [
  { label: 'API reference', href: `${API_BASE_URL}/docs` },
  { label: 'OpenAPI spec', href: `${REPOSITORY_URL}/blob/master/docs/openapi.json` },
  { label: 'Request flows', href: `${REPOSITORY_URL}/blob/master/docs/flows.md` },
  { label: 'Source code', href: REPOSITORY_URL },
];
