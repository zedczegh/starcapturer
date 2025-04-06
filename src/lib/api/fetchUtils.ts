
/**
 * Utility functions for API fetching with enhanced error handling and timeouts
 */

/**
 * Fetch with timeout functionality
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns Response promise
 */
export async function fetchWithTimeout(
  url: string, 
  options?: RequestInit, 
  timeoutMs: number = 10000
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Fetch timeout after ${timeoutMs}ms for URL: ${url}`));
      }, timeoutMs);
    }),
  ]) as Promise<Response>;
}

/**
 * Fetch with retry functionality
 * @param url URL to fetch
 * @param options Fetch options
 * @param maxRetries Maximum number of retries
 * @param timeoutMs Timeout in milliseconds
 * @returns Response promise
 */
export async function fetchWithRetry(
  url: string, 
  options?: RequestInit, 
  maxRetries: number = 3,
  timeoutMs: number = 10000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add increasing backoff between retries
      if (attempt > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
      
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (error) {
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries} failed for ${url}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

/**
 * Fetch JSON with timeout and type safety
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns Typed response data
 */
export async function fetchJson<T>(
  url: string, 
  options?: RequestInit, 
  timeoutMs: number = 10000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}
