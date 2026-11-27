import { DomainError } from '../../common/errors/domain-error';

export class InvalidCursorError extends DomainError {
  readonly code = 'PRODUCTS_INVALID_CURSOR';
  readonly category = 'invalid_input';

  constructor(options: { readonly cause: unknown }) {
    super('The cursor is not valid. Use the nextCursor value from a previous page.', options);
  }
}
