import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainError, type ErrorCategory } from './domain-error';
import type { ErrorBody } from './error-body';

const STATUS_BY_CATEGORY: Readonly<Record<ErrorCategory, HttpStatus>> = {
  invalid_input: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  rate_limited: HttpStatus.TOO_MANY_REQUESTS,
};

const FIRST_SERVER_ERROR_STATUS = 500;

const INTERNAL_ERROR_BODY: ErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const context = host.switchToHttp();
    const request: unknown = context.getRequest();
    const body = this.toBody(exception);

    if (body.statusCode >= FIRST_SERVER_ERROR_STATUS) {
      this.logger.error(`${this.describe(request)} failed`, exception);
    } else if (exception instanceof DomainError && exception.cause !== undefined) {
      this.logger.warn(`${this.describe(request)} failed with ${exception.code}`, exception.cause);
    }

    httpAdapter.reply(context.getResponse(), body, body.statusCode);
  }

  private describe(request: unknown): string {
    const { httpAdapter } = this.adapterHost;
    const method: unknown = httpAdapter.getRequestMethod(request);
    const url: unknown = httpAdapter.getRequestUrl(request);
    return `${String(method)} ${String(url)}`;
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof DomainError) {
      return fromDomainError(exception);
    }
    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }
    return INTERNAL_ERROR_BODY;
  }
}

function fromDomainError(error: DomainError): ErrorBody {
  return {
    statusCode: STATUS_BY_CATEGORY[error.category],
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  };
}

function fromHttpException(exception: HttpException): ErrorBody {
  const statusCode = exception.getStatus();
  const code = HttpStatus[statusCode] ?? 'HTTP_ERROR';
  const response = exception.getResponse();
  const message: unknown =
    typeof response === 'object' && 'message' in response ? response.message : response;

  if (typeof message === 'string') {
    return { statusCode, code, message };
  }
  if (isStringArray(message)) {
    return { statusCode, code, message: 'Request validation failed', details: message };
  }
  return { statusCode, code, message: exception.message };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
