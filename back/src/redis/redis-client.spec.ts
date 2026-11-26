import { Logger } from '@nestjs/common';
import { connectRedisClient, createRedisClient } from './redis-client';

describe('createRedisClient', () => {
  it('reads the host and port from the URL and waits to connect', () => {
    const client = createRedisClient({ url: 'redis://cache.local:6380' });

    expect(client.options.host).toBe('cache.local');
    expect(client.options.port).toBe(6380);
    expect(client.status).toBe('wait');
  });

  it('turns on TLS for a rediss URL', () => {
    const client = createRedisClient({ url: 'rediss://cache.example.com:6379' });

    expect(client.options.tls).toBeDefined();
  });

  it('logs connection errors as warnings', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const client = createRedisClient({ url: 'redis://localhost:6379' });

    client.emit('error', new Error('connect ECONNREFUSED'));

    expect(warn).toHaveBeenCalledWith('Redis connection error: connect ECONNREFUSED');
    warn.mockRestore();
  });

  it('logs the error code when the error has no message', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const client = createRedisClient({ url: 'redis://localhost:6379' });
    const error: NodeJS.ErrnoException = new AggregateError([], '');
    error.code = 'ECONNREFUSED';

    client.emit('error', error);

    expect(warn).toHaveBeenCalledWith('Redis connection error: ECONNREFUSED');
    warn.mockRestore();
  });

  it('logs the error name when the error has no message and no code', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const client = createRedisClient({ url: 'redis://localhost:6379' });

    client.emit('error', new AggregateError([], ''));

    expect(warn).toHaveBeenCalledWith('Redis connection error: AggregateError');
    warn.mockRestore();
  });
});

describe('connectRedisClient', () => {
  it('returns the client once it connects', async () => {
    const client = createRedisClient({ url: 'redis://localhost:6379' });
    jest.spyOn(client, 'connect').mockResolvedValue(undefined);

    await expect(connectRedisClient(client)).resolves.toBe(client);
  });

  it('disconnects the client and rethrows when it cannot connect', async () => {
    const client = createRedisClient({ url: 'redis://localhost:6379' });
    const failure = new Error('Connection is closed.');
    jest.spyOn(client, 'connect').mockRejectedValue(failure);
    const disconnect = jest.spyOn(client, 'disconnect');

    await expect(connectRedisClient(client)).rejects.toBe(failure);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
