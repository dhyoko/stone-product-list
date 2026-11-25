import { DomainError } from '../common/errors/domain-error';

export class InvalidTokenError extends DomainError {
  readonly code = 'AUTH_INVALID_TOKEN';
  readonly category = 'unauthenticated';

  constructor(options: { readonly cause: unknown }) {
    super('The access token is missing, expired, or not valid', options);
  }
}
