/**
 * Request Deduplication Layer
 * 
 * Prevents multiple identical API calls from being made simultaneously.
 * If a request is already in-flight, subsequent calls wait for the same promise.
 */

const inFlightRequests = new Map<string, Promise<any>>();

export async function fetchWithDedup<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<T> {
    // Check if this request is already in-flight
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key)!;
    }

    // Create new request and store the promise
    const promise = fetcher().finally(() => {
        // Clean up after request completes
        inFlightRequests.delete(key);
    });

    inFlightRequests.set(key, promise);
    return promise;
}

/**
 * In-Memory Cache Layer
 * 
 * Simple cache with TTL for server-side TMDB responses.
 * Reduces API calls and improves response time.
 */

interface CacheEntry<T> {
    data: T;
    expires: number;
}

const cache = new Map<string, CacheEntry<any>>();

export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
): Promise<T> {
    // Check cache first
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
        return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    cache.set(key, {
        data,
        expires: Date.now() + ttlSeconds * 1000,
    });

    return data;
}

/**
 * Combined: Deduplication + Caching
 * 
 * Best of both worlds - prevents duplicate in-flight requests
 * AND caches responses for subsequent calls.
 */

export async function fetchOptimized<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
): Promise<T> {
    return fetchWithDedup(key, () => fetchWithCache(key, fetcher, ttlSeconds));
}

/**
 * Cache invalidation utility
 */

export function invalidateCache(keyPattern?: string) {
    if (!keyPattern) {
        // Clear entire cache
        cache.clear();
        return;
    }

    // Clear matching keys
    for (const key of cache.keys()) {
        if (key.includes(keyPattern)) {
            cache.delete(key);
        }
    }
}

/**
 * Cache size management
 * Clean up old entries periodically
 */

export function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (entry.expires < now) {
            cache.delete(key);
        }
    }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupCache, 5 * 60 * 1000);
}
