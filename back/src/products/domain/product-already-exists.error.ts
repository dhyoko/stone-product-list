import { DomainError } from '../../common/errors/domain-error';

export class ProductAlreadyExistsError extends DomainError {
  readonly code = 'PRODUCT_ALREADY_EXISTS';
  readonly category = 'conflict';

  constructor(options: { readonly cause: unknown }) {
    super('A product with this id already exists', options);
  }
}
