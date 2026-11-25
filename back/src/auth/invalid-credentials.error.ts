import { DomainError } from '../common/errors/domain-error';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'AUTH_INVALID_CREDENTIALS';
  readonly category = 'unauthenticated';

  constructor() {
    super('Invalid email or password');
  }
}
