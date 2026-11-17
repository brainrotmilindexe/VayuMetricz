/** Tiny fetch wrapper with in-memory TTL caching and clear error messages. */

interface CacheEntry {
  expires: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  /** Cache lifetime in milliseconds. 0 disables caching. */
  ttlMs?: number;
  /** Bypass a fresh cache entry and refetch. */
  force?: boolean;
  signal?: AbortSignal;
}

export async function getJSON<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { ttlMs = 0, force = false, signal } = options;
  const cached = cache.get(url);
  if (!force && cached && cached.expires > Date.now()) {
    return cached.value as T;
  }

  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('Network request failed. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError('The weather service is rate limiting requests. Please wait a moment and refresh.');
    }
    if (response.status >= 500) {
      throw new ApiError('The weather service is temporarily unavailable. Please try again shortly.');
    }
    throw new ApiError(`The weather service rejected the request (HTTP ${response.status}).`);
  }

  let payload: T;
  try {
    payload = (await response.json()) as T;
  } catch {
    throw new ApiError('The weather service returned an unreadable response.');
  }

  if (payload && typeof payload === 'object' && 'error' in payload && (payload as { error?: boolean }).error) {
    const reason = (payload as { reason?: string }).reason;
    throw new ApiError(reason ? `Weather service error: ${reason}` : 'The weather service returned an error.');
  }

  if (ttlMs > 0) {
    cache.set(url, { expires: Date.now() + ttlMs, value: payload });
  }
  return payload;
}

export function clearApiCache(): void {
  cache.clear();
}
