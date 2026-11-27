import { z } from 'zod';
import { ApiError } from './api-error';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(z.string()).optional(),
});

export interface ApiRequest<T> {
  readonly path: string;
  readonly schema: z.ZodType<T>;
  readonly method?: 'GET' | 'POST';
  readonly body?: unknown;
  readonly accessToken?: string;
  readonly signal?: AbortSignal;
}

export async function requestJson<T>(request: ApiRequest<T>): Promise<T> {
  const response = await send(request);
  const body = await readJson(response);
  if (!response.ok) {
    throw toApiError(response, body);
  }
  const parsed = request.schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'UNEXPECTED_RESPONSE',
      message: 'The server sent a response that the app cannot read.',
      cause: parsed.error,
    });
  }
  return parsed.data;
}

async function send(request: ApiRequest<unknown>): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });
  if (request.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (request.accessToken !== undefined) {
    headers.set('Authorization', `Bearer ${request.accessToken}`);
  }
  try {
    return await fetch(`${API_BASE_URL}${request.path}`, {
      method: request.method ?? 'GET',
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'The server cannot be reached. Check your connection and try again.',
      cause: error,
    });
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function toApiError(response: Response, body: unknown): ApiError {
  const parsed = errorBodySchema.safeParse(body);
  const retryAfterSeconds = Number(response.headers.get('Retry-After') ?? Number.NaN);
  return new ApiError({
    status: response.status,
    code: parsed.success ? parsed.data.code : 'UNEXPECTED_RESPONSE',
    message: parsed.success ? parsed.data.message : `The server answered with ${response.status}.`,
    details: parsed.success ? parsed.data.details : undefined,
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
  });
}
