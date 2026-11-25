import { DomainError } from '../common/errors/domain-error';

export class UserAlreadyExistsError extends DomainError {
  readonly code = 'USER_ALREADY_EXISTS';
  readonly category = 'conflict';

  constructor(options: { readonly cause: unknown }) {
    super('A user with this email already exists', options);
  }
}
