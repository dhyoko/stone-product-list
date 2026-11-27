import { DomainError, type DomainErrorOptions } from '../../common/errors/domain-error';

export class InvalidTokenError extends DomainError {
  readonly code = 'AUTH_INVALID_TOKEN';
  readonly category = 'unauthenticated';

  constructor(options: DomainErrorOptions = {}) {
    super('The access token is missing, expired, or not valid', options);
  }
}
