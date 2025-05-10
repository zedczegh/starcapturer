
/**
 * Queue management for SIQS requests
 */

// Staggered load strategy for multiple instances
export const activeRequests = new Set<string>();
export const requestQueue: Array<() => void> = [];
export const MAX_CONCURRENT_REQUESTS = 3;

/**
 * Process the request queue, executing requests if capacity is available
 */
export function processQueue(): void {
  // If we have capacity and queue isn't empty, process next request
  while (activeRequests.size < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
    const nextRequest = requestQueue.shift();
    if (nextRequest) nextRequest();
  }
}

/**
 * Execute fetch with queueing to prevent too many concurrent requests
 */
export function executeQueuedFetch(
  cacheKey: string | null,
  fetchFn: () => Promise<void>,
): Promise<void> {
  if (!cacheKey) return Promise.resolve();
  
  if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
    // Queue the request
    return new Promise<void>((resolve) => {
      requestQueue.push(() => {
        activeRequests.add(cacheKey);
        fetchFn()
          .finally(() => {
            activeRequests.delete(cacheKey);
            processQueue();
            resolve();
          });
      });
    });
  } else {
    // Execute immediately
    activeRequests.add(cacheKey);
    return fetchFn().finally(() => {
      activeRequests.delete(cacheKey);
      processQueue();
    });
  }
}
