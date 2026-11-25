import {
  type ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { DomainError, type DomainErrorOptions, type ErrorCategory } from './domain-error';

class TestDomainError extends DomainError {
  readonly code = 'TEST_ERROR';

  constructor(
    readonly category: ErrorCategory,
    options?: DomainErrorOptions,
  ) {
    super('Something failed', options);
  }
}

describe('AllExceptionsFilter', () => {
  const request = { id: 'request' };
  const response = { id: 'response' };
  const httpAdapter = {
    reply: jest.fn(),
    getRequestMethod: jest.fn().mockReturnValue('GET'),
    getRequestUrl: jest.fn().mockReturnValue('/products'),
  };
  const host: ArgumentsHost = {
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    switchToHttp: () => ({
      getRequest: jest.fn().mockReturnValue(request),
      getResponse: jest.fn().mockReturnValue(response),
      getNext: jest.fn(),
    }),
  };

  let filter: AllExceptionsFilter;
  let logError: jest.SpyInstance;
  let logWarn: jest.SpyInstance;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AllExceptionsFilter, { provide: HttpAdapterHost, useValue: { httpAdapter } }],
    }).compile();

    filter = moduleRef.get(AllExceptionsFilter);
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    logWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    httpAdapter.getRequestMethod.mockReturnValue('GET');
    httpAdapter.getRequestUrl.mockReturnValue('/products');
  });

  describe('with a domain error', () => {
    it.each<[ErrorCategory, HttpStatus]>([
      ['invalid_input', HttpStatus.BAD_REQUEST],
      ['unauthenticated', HttpStatus.UNAUTHORIZED],
      ['forbidden', HttpStatus.FORBIDDEN],
      ['not_found', HttpStatus.NOT_FOUND],
      ['conflict', HttpStatus.CONFLICT],
    ])('maps the %s category to status %d', (category, status) => {
      filter.catch(new TestDomainError(category), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: status, code: 'TEST_ERROR', message: 'Something failed' },
        status,
      );
    });

    it('includes the details when the error has them', () => {
      filter.catch(new TestDomainError('invalid_input', { details: ['limit: too large'] }), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        expect.objectContaining({ details: ['limit: too large'] }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('does not send the cause', () => {
      const cause = new Error('connection string with a password');

      filter.catch(new TestDomainError('not_found', { cause }), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: HttpStatus.NOT_FOUND, code: 'TEST_ERROR', message: 'Something failed' },
        HttpStatus.NOT_FOUND,
      );
    });

    it('logs the cause as a warning with the request and the code', () => {
      const cause = new Error('cursor is not valid base64url');

      filter.catch(new TestDomainError('invalid_input', { cause }), host);

      expect(logWarn).toHaveBeenCalledWith('GET /products failed with TEST_ERROR', cause);
      expect(logError).not.toHaveBeenCalled();
    });

    it('does not log an error that has no cause', () => {
      filter.catch(new TestDomainError('not_found'), host);

      expect(logWarn).not.toHaveBeenCalled();
      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe('with an HttpException', () => {
    it('uses the status name as the code', () => {
      filter.catch(new NotFoundException('Cannot GET /missing'), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Cannot GET /missing' },
        HttpStatus.NOT_FOUND,
      );
    });

    it('uses a string response as the message', () => {
      filter.catch(new HttpException('Resource is gone', HttpStatus.GONE), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: HttpStatus.GONE, code: 'GONE', message: 'Resource is gone' },
        HttpStatus.GONE,
      );
    });

    it('turns a list of messages into details', () => {
      filter.catch(new BadRequestException(['email must be an email', 'password is empty']), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'BAD_REQUEST',
          message: 'Request validation failed',
          details: ['email must be an email', 'password is empty'],
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('falls back to the exception message when the response has no usable message', () => {
      const exception = new HttpException({ message: 42 }, HttpStatus.I_AM_A_TEAPOT);

      filter.catch(exception, host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: HttpStatus.I_AM_A_TEAPOT, code: 'I_AM_A_TEAPOT', message: exception.message },
        HttpStatus.I_AM_A_TEAPOT,
      );
    });

    it('uses HTTP_ERROR as the code for a status without a name', () => {
      filter.catch(new HttpException('Client closed request', 499), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        { statusCode: 499, code: 'HTTP_ERROR', message: 'Client closed request' },
        499,
      );
    });

    it('logs a server error status', () => {
      const exception = new ServiceUnavailableException('Database is down');

      filter.catch(exception, host);

      expect(logError).toHaveBeenCalledWith('GET /products failed', exception);
    });

    it('does not log a client error status', () => {
      filter.catch(new NotFoundException(), host);

      expect(logError).not.toHaveBeenCalled();
      expect(logWarn).not.toHaveBeenCalled();
    });
  });

  describe('with an unknown error', () => {
    it('sends a generic 500 without the error message', () => {
      filter.catch(new Error('secret table name'), host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('logs the request and the error', () => {
      const error = new Error('secret table name');

      filter.catch(error, host);

      expect(logError).toHaveBeenCalledWith('GET /products failed', error);
    });

    it('handles a thrown value that is not an Error', () => {
      filter.catch('a plain string', host);

      expect(httpAdapter.reply).toHaveBeenCalledWith(
        response,
        expect.objectContaining({ code: 'INTERNAL_ERROR' }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });
});
