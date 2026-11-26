import { DomainError } from '../common/errors/domain-error';

export class RateLimitExceededError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly category = 'rate_limited';

  constructor() {
    super('Too many requests. Try again later.');
  }
}
