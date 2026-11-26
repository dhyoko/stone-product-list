import { ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/errors/error-response.dto';

export function ApiRateLimitedResponse(): MethodDecorator & ClassDecorator {
  return ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'The client sent too many requests in the rate limit window',
    headers: {
      'Retry-After': {
        description: 'Seconds to wait before the next request',
        schema: { type: 'integer' },
      },
    },
  });
}
