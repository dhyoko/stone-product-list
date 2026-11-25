import { DomainError } from './domain-error';

class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND';
  readonly category = 'not_found';
}

describe('DomainError', () => {
  it('uses the subclass name as the error name', () => {
    const error = new ProductNotFoundError('Product not found');

    expect(error.name).toBe('ProductNotFoundError');
    expect(error.message).toBe('Product not found');
    expect(error).toBeInstanceOf(Error);
  });

  it('keeps the original error as the cause', () => {
    const cause = new Error('connection reset');

    const error = new ProductNotFoundError('Product not found', { cause });

    expect(error.cause).toBe(cause);
  });

  it('keeps the details', () => {
    const error = new ProductNotFoundError('Product not found', { details: ['id: 42'] });

    expect(error.details).toEqual(['id: 42']);
  });

  it('has no details by default', () => {
    const error = new ProductNotFoundError('Product not found');

    expect(error.details).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
